"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEventCategories } from "@/lib/useEventCategories";
import { useDestinationAreas } from "@/lib/useDestinationAreas";

interface Entry {
  id: string;
  eventName: string;
  eventType: string;
  linkType: string;
  driveLink: string;
  recordingDate: string;
  contentResponsible: string;
  destinationArea: string;
  createdBy: { name: string };
}


export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const { areas: destAreas, areaLabel: destLabel } = useDestinationAreas();
  const { categories: eventCategories, categoryLabel: eventTypeLabel } = useEventCategories();
  const destinationLabel = (v: string) => {
    const parts = v.split(",").filter(Boolean);
    if (parts.length === 0) return "—";
    return parts.map(a => destLabel(a)).join(", ");
  };

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [eventType, setEventType] = useState("ALL");
  const [destinationArea, setDestinationArea] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (eventType !== "ALL") params.set("eventType", eventType);
    if (destinationArea !== "ALL") params.set("destinationArea", destinationArea);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/entries?${params.toString()}`);
    setEntries(await res.json());
    setLoading(false);
  }, [q, eventType, destinationArea, dateFrom, dateTo]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function clearFilters() {
    setQ(""); setEventType("ALL"); setDestinationArea("ALL");
    setDateFrom(""); setDateTo("");
  }

  const hasFilters = q || eventType !== "ALL" || destinationArea !== "ALL" || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Directorio de <span className="text-[var(--brand)]">Contenido</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {entries.length} registro{entries.length !== 1 ? "s" : ""} encontrado{entries.length !== 1 ? "s" : ""}
          </p>
        </div>
        {role === "ADMIN" && (
          <Link
            href="/dashboard/entries/new"
            className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
          >
            + Nuevo Registro
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            placeholder="Buscar por evento, responsable, notas..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-[#162216] border border-[#1f3320] text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-gray-400 hover:text-white border border-[#1f3320] hover:border-[var(--brand)]/30 px-4 py-2 rounded-full transition-all shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="bg-[#162216] border border-[#1f3320] text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--brand)] transition-colors"
          >
            <option value="ALL">Todos los tipos</option>
            {eventCategories.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select
            value={destinationArea}
            onChange={(e) => setDestinationArea(e.target.value)}
            className="bg-[#162216] border border-[#1f3320] text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--brand)] transition-colors"
          >
            <option value="ALL">Todas las áreas</option>
            {destAreas.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#162216] border border-[#1f3320] text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--brand)] transition-colors"
            style={{ colorScheme: "dark" }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#162216] border border-[#1f3320] text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--brand)] transition-colors"
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Cargando...</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-base">No se encontraron registros</p>
            {hasFilters && <p className="text-gray-600 text-sm mt-1">Ajusta los filtros para ver más resultados</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#1f3320]">
                <tr>
                  {["Evento", "Tipo", "Fecha", "Responsable", "Destino", "Link", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f3320]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#162216] transition-colors group">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-white">{entry.eventName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block text-xs font-semibold text-[var(--brand)] border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {eventTypeLabel(entry.eventType)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(entry.recordingDate).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5 text-gray-300">{entry.contentResponsible}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-white text-xs">{destinationLabel(entry.destinationArea)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={entry.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:text-white transition-colors"
                      >
                        {entry.linkType === "FOLDER" ? "📁" : "📄"} Abrir ↗
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/entries/${entry.id}`}
                        className="text-xs text-gray-600 hover:text-[var(--brand)] transition-colors font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
