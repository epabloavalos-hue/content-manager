"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Folder {
  id: string;
  name: string;
  description: string | null;
  driveLink: string;
  color: string;
}

const PRESET_COLORS = [
  { hex: "#22c55e", label: "Verde" },
  { hex: "#3b82f6", label: "Azul" },
  { hex: "#a855f7", label: "Morado" },
  { hex: "#f59e0b", label: "Amarillo" },
  { hex: "#ef4444", label: "Rojo" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#f97316", label: "Naranja" },
  { hex: "#ec4899", label: "Rosa" },
];

export default function CarpetasImportantesPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN";

  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal crear
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", driveLink: "", color: "#22c55e" });

  // Modal editar
  const [editFolder, setEditFolder] = useState<Folder | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", driveLink: "", color: "#22c55e" });
  const [editSaving, setEditSaving] = useState(false);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchFolders() {
    const res = await fetch("/api/carpetas-importantes");
    setFolders(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchFolders(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/carpetas-importantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    setForm({ name: "", description: "", driveLink: "", color: "#22c55e" });
    await fetchFolders();
    setSaving(false);
  }

  function openEdit(folder: Folder) {
    setEditFolder(folder);
    setEditForm({ name: folder.name, description: folder.description ?? "", driveLink: folder.driveLink, color: folder.color });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editFolder) return;
    setEditSaving(true);
    await fetch(`/api/carpetas-importantes/${editFolder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditFolder(null);
    await fetchFolders();
    setEditSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/carpetas-importantes/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await fetchFolders();
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Carpetas <span className="text-[var(--brand)]">Importantes</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Acceso rápido a las carpetas de Drive del equipo
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
          >
            + Crear Casilla
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <p className="text-gray-400 font-semibold">Sin carpetas aún</p>
          {isAdmin && <p className="text-gray-600 text-sm mt-1">Usa "Crear Casilla" para añadir la primera</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              isAdmin={isAdmin}
              onEdit={() => openEdit(folder)}
              onDelete={() => setDeleteTarget(folder)}
            />
          ))}
        </div>
      )}

      {/* Modal Crear Casilla */}
      {modalOpen && (
        <FolderModal
          title="Crear Casilla"
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={handleCreate}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Modal Editar */}
      {editFolder && (
        <FolderModal
          title="Editar Casilla"
          form={editForm}
          setForm={setEditForm}
          saving={editSaving}
          onSubmit={handleEdit}
          onClose={() => setEditFolder(null)}
        />
      )}

      {/* Confirm Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e1a0f] border border-[#1f3320] rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-white">Eliminar casilla</h2>
            <p className="text-gray-400 text-sm">
              ¿Eliminar <span className="text-white font-semibold">{deleteTarget.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-full border border-[#1f3320] text-gray-300 text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderCard({
  folder,
  isAdmin,
  onEdit,
  onDelete,
}: {
  folder: Folder;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
      style={{ background: `linear-gradient(135deg, ${folder.color}18 0%, ${folder.color}08 100%)` }}>

      {/* Admin actions */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
            className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"
            title="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-red-900/80 transition-colors"
            title="Eliminar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <a
        href={folder.driveLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center gap-3 p-5 h-40 text-center"
      >
        {/* Folder icon */}
        <div className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${folder.color}25` }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: folder.color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </div>

        <div className="space-y-0.5">
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{folder.name}</p>
          {folder.description && (
            <p className="text-gray-500 text-xs line-clamp-2">{folder.description}</p>
          )}
        </div>
      </a>
    </div>
  );
}

function FolderModal({
  title,
  form,
  setForm,
  saving,
  onSubmit,
  onClose,
}: {
  title: string;
  form: { name: string; description: string; driveLink: string; color: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; driveLink: string; color: string }>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e1a0f] border border-[#1f3320] rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Grabaciones 2025"
              className="w-full bg-[#0a130a] border border-[#1f3320] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción breve (opcional)"
              className="w-full bg-[#0a130a] border border-[#1f3320] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Link de Google Drive *</label>
            <input
              type="url"
              required
              value={form.driveLink}
              onChange={(e) => setForm((f) => ({ ...f, driveLink: e.target.value }))}
              placeholder="https://drive.google.com/..."
              className="w-full bg-[#0a130a] border border-[#1f3320] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Color de la casilla</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.hex }))}
                  title={c.label}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    backgroundColor: c.hex,
                    outline: form.color === c.hex ? `2px solid ${c.hex}` : "none",
                    outlineOffset: "2px",
                    opacity: form.color === c.hex ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-[#1f3320] text-gray-300 text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black text-sm font-bold transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
