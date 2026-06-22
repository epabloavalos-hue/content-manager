"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDestinationAreas } from "@/lib/useDestinationAreas";

interface HistoryEntry {
  id: string;
  eventName: string;
  destinationArea: string;
  createdAt: string;
  createdBy: { name: string };
  assignments: { userId: string; user: { id: string; name: string } }[];
  acknowledgments: { userId: string }[];
  userStatuses: { userId: string; status: string; editProgress: number; user: { role: string } }[];
}

export default function HistorialPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { areaLabel } = useDestinationAreas();

  useEffect(() => {
    fetch("/api/admin/history")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Historial de <span className="text-[var(--brand)]">Registros</span>
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {entries.length} registro{entries.length !== 1 ? "s" : ""} en total · orden cronológico
        </p>
      </div>

      <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Cargando...</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-gray-500">Sin registros aún</div>
        ) : (
          <ul className="divide-y divide-[#1f3320]">
            {entries.map((entry, idx) => {
              const total = entry.assignments.length;
              const acked = entry.acknowledgments.length;
              const allDone = total > 0 && acked >= total;
              const ackedIds = new Set(entry.acknowledgments.map((a) => a.userId));
              const statusMap = new Map(entry.userStatuses.map((s) => [s.userId, s.status]));
              const allEdited = total > 0 && entry.assignments.every((a) => statusMap.get(a.userId) === "EDITADO");
              const areas = entry.destinationArea.split(",").filter(Boolean);

              return (
                <li
                  key={entry.id}
                  className={`px-5 py-4 transition-colors border-l-2 ${
                    allEdited
                      ? "bg-emerald-950/40 hover:bg-emerald-950/60 border-l-emerald-500/70"
                      : "hover:bg-[#162216] border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">

                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="shrink-0 text-xs font-black text-gray-600 w-6 text-right mt-1">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/entries/${entry.id}`}
                          className="font-bold text-white hover:text-[var(--brand)] transition-colors text-sm leading-snug"
                        >
                          {entry.eventName}
                        </Link>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {areas.map((a) => (
                            <span key={a} className="text-[10px] font-semibold text-[var(--brand)] border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-2 py-0.5 rounded-full">
                              {areaLabel(a)}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-1.5">
                          {new Date(entry.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
                          {" · "}<span className="text-gray-500">{entry.createdBy.name}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: per-user status + enterado */}
                    <div className="shrink-0 text-right min-w-[160px]">
                      {total === 0 ? (
                        <span className="text-xs text-gray-600 italic">Sin asignados</span>
                      ) : (
                        <div className="space-y-1.5">
                          {/* Enterado badge when all done */}
                          {allDone && (
                            <div className="flex justify-end mb-1">
                              <span className="text-[10px] font-black text-[var(--brand)] border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2.5 py-0.5 rounded-full">
                                ✓ Todos enterados
                              </span>
                            </div>
                          )}
                          {!allDone && (
                            <p className="text-[10px] text-gray-600 mb-1">{acked}/{total} enterados</p>
                          )}

                          {/* Per-user row */}
                          {entry.assignments.map((a) => {
                            const st = statusMap.get(a.userId);
                            const isAcked = ackedIds.has(a.userId);
                            return (
                              <div key={a.userId} className="flex items-center justify-end gap-2 text-xs">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={isAcked ? "text-[var(--brand)] font-semibold" : "text-gray-400"}>
                                    {a.user.name}
                                  </span>
                                  {st ? (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                        st === "EDITADO"
                                          ? "text-[var(--brand)] border-[var(--brand)]/30 bg-[var(--brand)]/10"
                                          : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                                      }`}>
                                        {st === "EDITADO" ? "✓ Editado" : "✏ En edición"}
                                      </span>
                                      {entry.userStatuses.find(us => us.userId === a.userId)?.user?.role === "EDITOR" && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <div className="w-14 h-1 bg-[#1f3320] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${entry.userStatuses.find(us => us.userId === a.userId)?.editProgress ?? 0}%`, opacity: 0.8 }} />
                                          </div>
                                          <span className="text-[9px] text-gray-500 font-bold">{entry.userStatuses.find(us => us.userId === a.userId)?.editProgress ?? 0}%</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-700 italic">Sin estado</span>
                                  )}
                                </div>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isAcked ? "bg-[var(--brand)]" : "bg-gray-700"}`} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
