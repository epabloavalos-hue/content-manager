"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { EVENT_TYPES } from "@/lib/constants";
import { useDestinationAreas } from "@/lib/useDestinationAreas";

interface Entry {
  id: string; driveLink: string; linkType: string; eventName: string;
  eventType: string; recordingDate: string; contentResponsible: string;
  destinationArea: string; proofImagePath: string | null;
  notes: string | null; createdAt: string; createdBy: { name: string; email: string };
  assignments: { userId: string; user: { id: string; name: string; position: string | null } }[];
  userStatuses: { userId: string; status: string; editProgress: number; user: { name: string; role: string } }[];
}

interface AckStats {
  ackCount: number;
  totalExpected: number;
  userAcked: boolean;
}

export default function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const canEdit = role === "ADMIN";

  const [entry, setEntry] = useState<Entry | null>(null);
  const [ackStats, setAckStats] = useState<AckStats>({ ackCount: 0, totalExpected: 0, userAcked: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [acking, setAcking] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [myProgress, setMyProgress] = useState<number>(0);
  const [settingStatus, setSettingStatus] = useState(false);
  const userId = (session?.user as { id?: string })?.id;
  const { areas: destAreas, areaLabel, areaContact } = useDestinationAreas();

  const fetchEntry = useCallback(async () => {
    const [entryRes, notifRes] = await Promise.all([
      fetch(`/api/entries/${id}`),
      fetch("/api/notifications"),
    ]);
    if (!entryRes.ok) { router.push("/dashboard"); return; }
    const entryData = await entryRes.json();
    setEntry(entryData);
    const myS = entryData.userStatuses?.find((s: { userId: string }) => s.userId === userId);
    if (myS) { setMyStatus(myS.status); setMyProgress(myS.editProgress ?? 0); }

    if (notifRes.ok) {
      const notifData = await notifRes.json().catch(() => ({}));
      const match = (notifData.entries ?? []).find((e: { id: string }) => e.id === id);
      if (match) {
        setAckStats({ ackCount: match.ackCount, totalExpected: match.totalExpected, userAcked: match.userAcked });
      }
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  async function handleSetStatus(status: string) {
    setSettingStatus(true);
    await fetch(`/api/entries/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMyStatus(status);
    setEntry((prev) => {
      if (!prev || !userId) return prev;
      const filtered = prev.userStatuses.filter((s) => s.userId !== userId);
      return { ...prev, userStatuses: [...filtered, { userId, status, editProgress: myProgress, user: { name: session?.user?.name ?? "", role: role ?? "" } }] };
    });
    setSettingStatus(false);
  }

  async function handleSetProgress(progress: number) {
    setMyProgress(progress);
    await fetch(`/api/entries/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editProgress: progress }),
    });
    const newStatus = progress === 100 ? "EDITADO" : progress > 0 ? "EN_EDICION" : myStatus ?? "EN_EDICION";
    if (progress === 100) setMyStatus("EDITADO");
    else if (progress > 0 && !myStatus) setMyStatus("EN_EDICION");
    setEntry((prev) => {
      if (!prev || !userId) return prev;
      const filtered = prev.userStatuses.filter((s) => s.userId !== userId);
      return { ...prev, userStatuses: [...filtered, { userId, status: newStatus, editProgress: progress, user: { name: session?.user?.name ?? "", role: role ?? "" } }] };
    });
  }

  async function handleAck() {
    setAcking(true);
    await fetch(`/api/entries/${id}/acknowledge`, { method: "POST" });
    setAckStats((prev) => ({ ...prev, userAcked: true, ackCount: prev.ackCount + 1 }));
    setAcking(false);
  }

  async function uploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(""); setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/entries/${id}/proof`, { method: "POST", body: fd });
    if (!res.ok) {
      setUploadError((await res.json()).error || "Error al subir");
    } else {
      const data = await res.json();
      setEntry((prev) => prev ? { ...prev, proofImagePath: data.proofImagePath } : prev);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function deleteEntry() {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (loading) return <div className="py-20 text-center text-gray-500">Cargando...</div>;
  if (!entry) return null;

  const eventLabel = EVENT_TYPES.find((e) => e.value === entry.eventType)?.label ?? entry.eventType;
  const areas = entry.destinationArea.split(",").filter(Boolean);
  const allAcked = ackStats.totalExpected > 0 && ackStats.ackCount >= ackStats.totalExpected;

  const sectionCls = "bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-5";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs font-semibold text-gray-500 hover:text-[var(--brand)] transition-colors mb-3 inline-flex items-center gap-1">
            ← Volver al directorio
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">{entry.eventName}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Registrado por <span className="text-gray-300">{entry.createdBy.name}</span> ·{" "}
            {new Date(entry.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canEdit && (
            <Link href={`/dashboard/entries/${id}/edit`}
              className="text-xs font-semibold text-gray-400 hover:text-white border border-[#1f3320] hover:border-[var(--brand)]/30 px-4 py-2 rounded-full transition-all">
              Editar
            </Link>
          )}
          {role === "ADMIN" && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)}
              className="text-xs font-semibold text-red-400 hover:text-white border border-red-900/40 hover:bg-red-900/20 px-4 py-2 rounded-full transition-all">
              Eliminar
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">¿Confirmar?</span>
              <button onClick={deleteEntry} className="text-xs font-bold text-white bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-full transition-colors">Sí, eliminar</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-full border border-[#1f3320] transition-colors">Cancelar</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Info */}
        <div className={sectionCls}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Datos del registro</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-[#1f3320]">
              <span className="text-xs text-gray-500">Tipo de evento</span>
              <span className="text-xs font-semibold text-[var(--brand)] border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-2.5 py-1 rounded-full uppercase tracking-wide">{eventLabel}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#1f3320]">
              <span className="text-xs text-gray-500">Fecha de grabación</span>
              <span className="text-white font-semibold text-sm">
                {new Date(entry.recordingDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-[#1f3320]">
              <span className="text-xs text-gray-500">Responsable</span>
              <span className="text-white font-semibold text-sm">{entry.contentResponsible}</span>
            </div>
            <div className="py-2.5 border-b border-[#1f3320]">
              <span className="text-xs text-gray-500 block mb-2">Áreas de destino</span>
              <div className="space-y-1.5">
                {areas.map((area) => (
                  <div key={area} className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">{areaLabel(area)}</span>
                    <span className="text-gray-500 text-xs">{areaContact(area)}</span>
                  </div>
                ))}
              </div>
            </div>
            {entry.notes && (
              <div className="pt-1">
                <p className="text-xs text-gray-500 mb-2">Notas</p>
                <p className="text-sm text-gray-300 bg-[#162216] rounded-xl p-3">{entry.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Link */}
          <div className={sectionCls}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Enlace de Drive</p>
            <a href={entry.driveLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[#162216] rounded-xl border border-[#1f3320] hover:border-[var(--brand)]/40 transition-all group">
              <span className="text-2xl">{entry.linkType === "FOLDER" ? "📁" : "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--brand)] text-sm">{entry.linkType === "FOLDER" ? "Carpeta" : "Archivo"} de Drive</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{entry.driveLink}</p>
              </div>
              <span className="text-[var(--brand)] text-sm shrink-0">↗</span>
            </a>
          </div>

          {/* Enterado status */}
          <div className={sectionCls}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Confirmaciones</p>

            {/* Admin: counter + assigned users list */}
            {role === "ADMIN" && entry.assignments && entry.assignments.length > 0 && (
              <>
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-3 ${
                  allAcked
                    ? "bg-[var(--brand)]/10 border-[var(--brand)]/30"
                    : "bg-[#162216] border-[#1f3320]"
                }`}>
                  <span className="text-sm font-bold text-white">
                    {allAcked ? "✓ Todos enterados" : "Esperando confirmaciones"}
                  </span>
                  <span className={`text-lg font-black ${allAcked ? "text-[var(--brand)]" : "text-gray-300"}`}>
                    {ackStats.ackCount}/{ackStats.totalExpected}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {entry.assignments.map((a) => (
                    <div key={a.userId} className="flex items-center justify-between text-xs px-3 py-2 bg-[#162216] rounded-lg border border-[#1f3320]">
                      <span className="text-gray-300 font-medium">{a.user.name}</span>
                      {a.user.position && <span className="text-gray-600">{a.user.position}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
            {role === "ADMIN" && (!entry.assignments || entry.assignments.length === 0) && (
              <p className="text-xs text-gray-600 italic">Sin usuarios asignados</p>
            )}

            {/* Usuario: Enterado button */}
            {role !== "ADMIN" && (
              ackStats.userAcked ? (
                <div className="flex items-center justify-center px-4 py-3 bg-[var(--brand)]/10 border border-[var(--brand)]/30 rounded-xl">
                  <span className="text-sm font-bold text-[var(--brand)]">✓ Ya marcaste como enterado</span>
                </div>
              ) : (
                <button
                  onClick={handleAck}
                  disabled={acking}
                  className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {acking ? "Registrando..." : "Enterado"}
                </button>
              )
            )}

            {/* Material status */}
            <div className="mt-4 pt-4 border-t border-[#1f3320]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estado de material</p>

              {/* EDITOR: progress indicator */}
              {role === "EDITOR" && (
                <div className="space-y-3">
                  {/* Progress bar visual */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 font-semibold">Progreso de edición</span>
                      <span className={`text-sm font-black ${myProgress === 100 ? "text-[var(--brand)]" : "text-white"}`}>
                        {myProgress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#162216] rounded-full overflow-hidden border border-[#1f3320]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${myProgress}%`,
                          background: myProgress === 100
                            ? "var(--brand)"
                            : `linear-gradient(90deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 70%, white) 100%)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Step buttons: 0 10 20 ... 100 */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleSetProgress(pct)}
                        className={`py-2 rounded-lg text-xs font-black transition-all border ${
                          myProgress === pct
                            ? pct === 100
                              ? "bg-[var(--brand)] text-black border-[var(--brand)]"
                              : "bg-[var(--brand)]/20 text-[var(--brand)] border-[var(--brand)]/60"
                            : myProgress > pct
                              ? "bg-[var(--brand)]/10 text-[var(--brand)]/60 border-[var(--brand)]/20"
                              : "bg-[#162216] text-gray-600 border-[#1f3320] hover:border-gray-600 hover:text-gray-300"
                        }`}
                      >
                        {pct === 100 ? "✓" : `${pct}%`}
                      </button>
                    ))}
                  </div>

                  {myProgress === 100 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--brand)]/10 border border-[var(--brand)]/30 rounded-xl">
                      <span className="text-[var(--brand)] text-sm">✓</span>
                      <span className="text-xs font-bold text-[var(--brand)]">¡Material completamente editado!</span>
                    </div>
                  )}
                </div>
              )}

              {/* VIEWER: simple toggle */}
              {role === "VIEWER" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSetStatus("EN_EDICION")}
                    disabled={settingStatus}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      myStatus === "EN_EDICION"
                        ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                        : "bg-[#162216] border-[#1f3320] text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    ✏️ En edición
                  </button>
                  <button
                    onClick={() => handleSetStatus("EDITADO")}
                    disabled={settingStatus}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      myStatus === "EDITADO"
                        ? "bg-[var(--brand)]/20 border-[var(--brand)]/50 text-[var(--brand)]"
                        : "bg-[#162216] border-[#1f3320] text-gray-500 hover:text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    ✓ Editado
                  </button>
                </div>
              )}

              {/* ADMIN: status + progress per user */}
              {role === "ADMIN" && (
                entry?.userStatuses && entry.userStatuses.length > 0 ? (
                  <div className="space-y-2">
                    {entry.userStatuses.map((s) => {
                      const isEditor = s.user.role === "EDITOR";
                      return (
                        <div key={s.userId} className="px-3 py-2.5 bg-[#162216] rounded-xl border border-[#1f3320] text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-semibold">{s.user.name}</span>
                            <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                              s.status === "EDITADO"
                                ? "text-[var(--brand)] border-[var(--brand)]/30 bg-[var(--brand)]/10"
                                : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                            }`}>
                              {s.status === "EDITADO" ? "✓ Editado" : "✏ En edición"}
                            </span>
                          </div>
                          {isEditor && (
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-600">Progreso</span>
                                <span className={`font-black ${s.editProgress === 100 ? "text-[var(--brand)]" : "text-gray-400"}`}>{s.editProgress ?? 0}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#0f1a0f] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${s.editProgress ?? 0}%`,
                                    backgroundColor: "var(--brand)",
                                    opacity: s.editProgress === 100 ? 1 : 0.7,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic">Sin estados registrados</p>
                )
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
