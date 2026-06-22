import { LINK_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

  const [dbAreas, dbCategories] = await Promise.all([
    prisma.appDestinationArea.findMany(),
    prisma.eventCategory.findMany(),
  ]);
  const areaLabel = (v: string) => dbAreas.find(a => a.value === v)?.label ?? v;
  const areaContact = (v: string) => dbAreas.find(a => a.value === v)?.contact ?? "";

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const entryUrl = `${appUrl}/dashboard/entries/${entry.id}`;
  const areas = entry.destinationArea.split(",").filter(Boolean);
  const areasText = areas.map((a) => `  • ${areaLabel(a)} (${areaContact(a)})`).join("\n");

  const text = [
    `📁 <b>Nuevo registro en el directorio</b>`,
    ``,
    `<b>${entry.eventName}</b>`,
    ``,
    `🎬 <b>Tipo:</b> ${dbCategories.find(c => c.value === entry.eventType)?.label ?? entry.eventType}`,
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
      body: JSON.stringify({ chat_id: channelId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) console.error("Telegram error:", await res.json().catch(() => ({})));
  } catch (err) {
    console.error("Error enviando notificación Telegram:", err);
  }
}
