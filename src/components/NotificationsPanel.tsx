"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/constants";
import { useEventCategories } from "@/lib/useEventCategories";
import { useDestinationAreas } from "@/lib/useDestinationAreas";

interface Entry {
  id: string;
  eventName: string;
  eventType: string;
  destinationArea: string;
  recordingDate: string;
  contentResponsible: string;
  createdAt: string;
  createdBy: { name: string };
  ackCount: number;
  totalExpected: number;
  userAcked: boolean;
  userAssigned: boolean;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  createdAt: string;
}

const LS_KEY = "notifications_last_seen";

function getLastSeen(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(LS_KEY) || "0", 10);
}

function setLastSeen() {
  localStorage.setItem(LS_KEY, Date.now().toString());
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
  isAdmin: boolean;
}

export default function NotificationsPanel({ open, onClose, onCountChange, isAdmin }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeenState] = useState<number>(0);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"entries" | "pending">("entries");

  const { areaLabel: destLabel, areaContact: destContact } = useDestinationAreas();
  const { categoryLabel: eventLabel } = useEventCategories();
  const deptLabel = (v: string | null) => v ? (DEPARTMENTS.find((d) => d.value === v)?.label ?? v) : "—";

  const fetchAndCount = useCallback(async () => {
    const seen = getLastSeen();
    setLastSeenState(seen);
    setLoading(true);
    const res = await fetch("/api/notifications");
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json().catch(() => ({}));
    const ents: Entry[] = data.entries ?? [];
    const pend: PendingUser[] = data.pendingUsers ?? [];
    setEntries(ents);
    setPendingUsers(pend);
    const unseenEntries = ents.filter((e) => new Date(e.createdAt).getTime() > seen).length;
    onCountChange(unseenEntries + pend.length);
    setLoading(false);
  }, [onCountChange]);

  useEffect(() => {
    fetchAndCount();
    const interval = setInterval(fetchAndCount, 30000);
    return () => clearInterval(interval);
  }, [fetchAndCount]);

  useEffect(() => {
    if (open) {
      setLastSeen();
      setLastSeenState(Date.now());
      onCountChange(pendingUsers.length);
    }
  }, [open, onCountChange, pendingUsers.length]);

  useEffect(() => {
    if (open && pendingUsers.length > 0 && isAdmin) {
      setTab("pending");
    } else if (open) {
      setTab("entries");
    }
  }, [open, pendingUsers.length, isAdmin]);

  async function handleApprove(userId: string, action: "approve" | "reject") {
    setApprovingId(userId);
    await fetch("/api/users/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    await fetchAndCount();
    setApprovingId(null);
  }

  async function handleAck(entryId: string) {
    setAckingId(entryId);
    await fetch(`/api/entries/${entryId}/acknowledge`, { method: "POST" });
    await fetchAndCount();
    setAckingId(null);
  }

  const isNew = (createdAt: string) => new Date(createdAt).getTime() > lastSeen;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col bg-[#0a1208] border-l border-[#1f3320] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f3320]">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Notificaciones</h2>
            <p className="text-xs text-gray-500 mt-0.5">Actividad reciente del sistema</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white border border-[#1f3320] hover:border-[var(--brand)]/30 w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tabs (only shown to admins) */}
        {isAdmin && (
          <div className="flex border-b border-[#1f3320]">
            <button
              onClick={() => setTab("entries")}
              className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                tab === "entries"
                  ? "text-[var(--brand)] border-b-2 border-[var(--brand)]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Registros
            </button>
            <button
              onClick={() => setTab("pending")}
              className={`flex-1 py-2.5 text-xs font-bold transition-all relative ${
                tab === "pending"
                  ? "text-[var(--brand)] border-b-2 border-[var(--brand)]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Usuarios pendientes
              {pendingUsers.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-black text-[9px] font-black rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && entries.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">Cargando...</div>
          ) : tab === "pending" && isAdmin ? (
            pendingUsers.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">✓</p>
                <p className="text-gray-500 text-sm">Sin solicitudes pendientes</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#1f3320]">
                {pendingUsers.map((u) => (
                  <li key={u.id} className="px-5 py-4 bg-amber-500/5 border-l-2 border-amber-500">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-white text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                        Pendiente
                      </span>
                    </div>

                    <div className="bg-[#162216] border border-[#1f3320] rounded-xl px-3 py-2 mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <p className="text-gray-600 uppercase tracking-wider text-[10px]">Puesto</p>
                        <p className="text-gray-300">{u.position || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 uppercase tracking-wider text-[10px]">Departamento</p>
                        <p className="text-gray-300">{deptLabel(u.department)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 uppercase tracking-wider text-[10px]">Teléfono</p>
                        <p className="text-gray-300">{u.phone || "—"}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-600 mb-3">
                      Solicitud enviada el{" "}
                      <span className="text-amber-400 font-semibold">
                        {new Date(u.createdAt).toLocaleDateString("es-MX", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </span>
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(u.id, "approve")}
                        disabled={approvingId === u.id}
                        className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black text-xs font-black py-2 rounded-full transition-all disabled:opacity-50"
                      >
                        {approvingId === u.id ? "..." : "Aprobar"}
                      </button>
                      <button
                        onClick={() => handleApprove(u.id, "reject")}
                        disabled={approvingId === u.id}
                        className="flex-1 border border-red-500/40 hover:bg-red-500/10 text-red-400 text-xs font-bold py-2 rounded-full transition-all disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            entries.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">🔔</p>
                <p className="text-gray-500 text-sm">Sin registros aún</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#1f3320]">
                {entries.map((entry) => {
                  const fresh = isNew(entry.createdAt);
                  const allAcked = entry.totalExpected > 0 && entry.ackCount >= entry.totalExpected;
                  return (
                    <li key={entry.id} className={`px-5 py-4 ${fresh ? "bg-[var(--brand)]/5" : ""}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {fresh && <span className="shrink-0 w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />}
                          <Link
                            href={`/dashboard/entries/${entry.id}`}
                            onClick={onClose}
                            className={`font-bold text-sm leading-snug hover:text-[var(--brand)] transition-colors truncate ${fresh ? "text-white" : "text-gray-300"}`}
                          >
                            {entry.eventName}
                          </Link>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[var(--brand)] border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {eventLabel(entry.eventType)}
                        </span>
                      </div>

                      <div className="bg-[#162216] border border-[#1f3320] rounded-xl px-3 py-2.5 mb-2.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Destino</p>
                        {entry.destinationArea.split(",").filter(Boolean).map((area) => (
                          <div key={area} className="mb-1 last:mb-0">
                            <p className="font-bold text-white text-sm leading-tight">{destLabel(area)}</p>
                            <p className="text-xs text-[var(--brand)]">{destContact(area)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Ack row */}
                      <div className="flex items-center justify-between gap-3 mt-2.5">
                        <div className="text-xs text-gray-600">
                          {new Date(entry.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          {" · "}<span className="text-gray-400">{entry.createdBy.name}</span>
                        </div>

                        {/* Admin: show counter */}
                        {isAdmin && entry.totalExpected > 0 && (
                          <span className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-full border ${
                            allAcked
                              ? "text-[var(--brand)] border-[var(--brand)]/40 bg-[var(--brand)]/10"
                              : "text-gray-400 border-[#1f3320] bg-[#162216]"
                          }`}>
                            {allAcked ? "✓ Todos enterados" : `${entry.ackCount}/${entry.totalExpected} enterados`}
                          </span>
                        )}

                        {/* Non-admin: show Enterado button only if assigned */}
                        {!isAdmin && entry.userAssigned && (
                          entry.userAcked ? (
                            <span className="shrink-0 text-xs font-bold text-[var(--brand)] border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-3 py-1 rounded-full">
                              ✓ Enterado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAck(entry.id)}
                              disabled={ackingId === entry.id}
                              className="shrink-0 text-xs font-black bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                            >
                              {ackingId === entry.id ? "..." : "Enterado"}
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#1f3320]">
          <p className="text-xs text-gray-600 text-center">
            {tab === "entries"
              ? `Últimos ${entries.length} registros · actualiza cada 30s`
              : `${pendingUsers.length} solicitud(es) esperando aprobación`}
          </p>
        </div>
      </div>
    </>
  );
}
