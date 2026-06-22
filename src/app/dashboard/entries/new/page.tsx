"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { EVENT_TYPES, LINK_TYPES } from "@/lib/constants";
import DestinationAreaPicker from "@/components/DestinationAreaPicker";
import UserPicker from "@/components/UserPicker";

interface User { id: string; name: string; position: string | null; department: string | null; }

export default function NewEntryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const [form, setForm] = useState({
    driveLink: "", linkType: "FOLDER", eventName: "", eventType: "",
    recordingDate: "", contentResponsible: "", notes: "",
  });
  const [destinationAreas, setDestinationAreas] = useState<string[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: User[]) => setUsers(data.filter((u) => (u as unknown as { role: string }).role !== "ADMIN")))
      .catch(() => {});
  }, []);

  if (role !== "ADMIN") {
    return <div className="text-center py-20 text-gray-500">Sin permisos para crear registros.</div>;
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.eventType) { setError("Selecciona el tipo de evento."); return; }
    if (destinationAreas.length === 0) { setError("Selecciona al menos un área de destino."); return; }
    if (!form.driveLink.includes("drive.google.com") && !form.driveLink.includes("docs.google.com")) {
      setError("El link debe ser de Google Drive."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, destinationArea: destinationAreas.join(","), assignedUserIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `Error ${res.status}`); setLoading(false); return; }
      router.push(`/dashboard/entries/${data.id}`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-[#162216] border border-[#1f3320] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors";
  const selectCls = "w-full bg-[#162216] border border-[#1f3320] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Nuevo <span className="text-[var(--brand)]">Registro</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Agrega un nuevo link de Drive al directorio</p>
      </div>

      <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Link de Google Drive *</label>
            <input type="url" placeholder="https://drive.google.com/..." value={form.driveLink}
              onChange={(e) => set("driveLink", e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Tipo de link *</label>
            <select value={form.linkType} onChange={(e) => set("linkType", e.target.value)} className={selectCls}>
              {LINK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Nombre del evento *</label>
            <input placeholder="Ej: Gira CDMX Enero 2025" value={form.eventName}
              onChange={(e) => set("eventName", e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Tipo de evento *</label>
            <select value={form.eventType} onChange={(e) => set("eventType", e.target.value)} className={selectCls}>
              <option value="">Seleccionar tipo...</option>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Fecha de grabación *</label>
            <input type="date" value={form.recordingDate}
              onChange={(e) => set("recordingDate", e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Responsable de contenido *</label>
            <input placeholder="Nombre del responsable" value={form.contentResponsible}
              onChange={(e) => set("contentResponsible", e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>
              Áreas de destino *
              {destinationAreas.length > 0 && (
                <span className="ml-2 text-[var(--brand)] normal-case font-normal">
                  {destinationAreas.length} seleccionada{destinationAreas.length > 1 ? "s" : ""}
                </span>
              )}
            </label>
            <DestinationAreaPicker selected={destinationAreas} onChange={setDestinationAreas} />
          </div>

          <div>
            <label className={labelCls}>
              Usuarios que deben confirmar
              {assignedUserIds.length > 0 && (
                <span className="ml-2 text-[var(--brand)] normal-case font-normal">
                  {assignedUserIds.length} seleccionado{assignedUserIds.length > 1 ? "s" : ""}
                </span>
              )}
            </label>
            <UserPicker users={users} selected={assignedUserIds} onChange={setAssignedUserIds} />
          </div>

          <div>
            <label className={labelCls}>Notas adicionales</label>
            <textarea rows={3} placeholder="Información extra opcional..." value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${inputCls} resize-none`} />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold py-3 rounded-full text-sm transition-colors disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar Registro"}
            </button>
            <button type="button" onClick={() => router.back()}
              className="text-sm font-semibold text-gray-400 hover:text-white border border-[#1f3320] hover:border-[var(--brand)]/30 px-5 py-3 rounded-full transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
