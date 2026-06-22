import { EVENT_TYPES, DESTINATION_AREAS, LINK_TYPES } from "@/lib/constants";

interface EntryData {
  id: string;
  eventName: string;
  eventType: string;
  linkType: string;
  recordingDate: Date | string;
  contentResponsible: string;
  destinationArea: string;
  driveLink: string;
  notes?: string | null;
  createdBy: { name: string };
}

function label<T extends { value: string; label: string }>(list: readonly T[], value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

function contact(area: string) {
  return DESTINATION_AREAS.find((d) => d.value === area)?.contact ?? "";
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export async function notifyNewEntry(entry: EntryData): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token || !channelId) {
    console.log("ℹ️  Telegram no configurado — omitiendo notificación.");
    return;
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const entryUrl = `${appUrl}/dashboard/entries/${entry.id}`;
  const areas = entry.destinationArea.split(",").filter(Boolean);
  const areasText = areas
    .map((a) => `  • ${label(DESTINATION_AREAS, a)} (${contact(a)})`)
    .join("\n");
  const text = [
    `📁 <b>Nuevo registro en el directorio</b>`,
    ``,
    `<b>${entry.eventName}</b>`,
    ``,
    `🎬 <b>Tipo:</b> ${label(EVENT_TYPES, entry.eventType)}`,
    `🔗 <b>Enlace:</b> ${label(LINK_TYPES, entry.linkType)}`,
    `📅 <b>Fecha de grabación:</b> ${formatDate(entry.recordingDate)}`,
    `👤 <b>Responsable de contenido:</b> ${entry.contentResponsible}`,
    ``,
    `📬 <b>Área${areas.length > 1 ? "s" : ""} de destino:</b>`,
    areasText,
    entry.notes ? `📝 <b>Notas:</b> ${entry.notes}` : null,
    ``,
    `👨‍💻 <b>Registrado por:</b> ${entry.createdBy.name}`,
    ``,
    `🔍 <a href="${entryUrl}">Ver registro completo</a>`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Telegram error:", err);
    }
  } catch (err) {
    console.error("Error enviando notificación Telegram:", err);
  }
}
