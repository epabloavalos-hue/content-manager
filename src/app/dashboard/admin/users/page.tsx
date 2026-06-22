"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface User { id: string; name: string; email: string; role: string; createdAt: string; }

const roleBadge = (r: string) => {
  if (r === "ADMIN") return <span className="text-xs font-semibold text-black bg-[var(--brand)] px-2.5 py-1 rounded-full">Administrador</span>;
  if (r === "EDITOR") return <span className="text-xs font-semibold text-blue-400 border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 rounded-full">Editor</span>;
  return <span className="text-xs font-semibold text-gray-400 border border-[#1f3320] px-2.5 py-1 rounded-full">Usuario</span>;
};

const inputCls = "w-full bg-[#162216] border border-[#1f3320] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors";
const selectCls = "w-full bg-[#162216] border border-[#1f3320] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] transition-colors";
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

export default function UsersAdminPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", password: "", role: "VIEWER" });
  const [newError, setNewError] = useState(""); const [newSaving, setNewSaving] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState(""); const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState(""); const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (role !== "ADMIN") return <div className="text-center py-20 text-gray-500">Acceso solo para administradores.</div>;

  async function createUser(e: React.FormEvent) {
    e.preventDefault(); setNewError(""); setNewSaving(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm) });
    if (!res.ok) { setNewError((await res.json()).error || "Error"); setNewSaving(false); return; }
    await fetchUsers();
    setNewForm({ name: "", email: "", password: "", role: "VIEWER" });
    setNewOpen(false); setNewSaving(false);
  }

  function openEdit(u: User) { setEditUser(u); setEditName(u.name); setEditRole(u.role); setEditPassword(""); }

  async function saveEdit() {
    if (!editUser) return; setEditSaving(true);
    const body: Record<string, string> = { name: editName, role: editRole };
    if (editPassword) body.password = editPassword;
    await fetch(`/api/users/${editUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await fetchUsers(); setEditUser(null); setEditSaving(false);
  }

  async function deleteUser(userId: string) {
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    await fetchUsers(); setDeleteId(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestión de <span className="text-[var(--brand)]">Usuarios</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setNewOpen(true)}
          className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
          + Nuevo Usuario
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#1f3320]">
                <tr>
                  {["Nombre", "Correo", "Rol", "Alta", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f3320]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#162216] transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white">{u.name}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3.5">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString("es-MX")}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(u)}
                          className="text-xs font-semibold text-gray-400 hover:text-white border border-[#1f3320] hover:border-[var(--brand)]/30 px-3 py-1.5 rounded-full transition-all">
                          Editar
                        </button>
                        {u.id !== session?.user?.id && deleteId !== u.id && (
                          <button onClick={() => setDeleteId(u.id)}
                            className="text-xs font-semibold text-red-500 hover:text-white border border-red-900/40 hover:bg-red-900/20 px-3 py-1.5 rounded-full transition-all">
                            Eliminar
                          </button>
                        )}
                        {deleteId === u.id && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">¿Seguro?</span>
                            <button onClick={() => deleteUser(u.id)} className="text-xs font-bold text-white bg-red-700 hover:bg-red-600 px-2.5 py-1 rounded-full">Sí</button>
                            <button onClick={() => setDeleteId(null)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-full border border-[#1f3320]">No</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permisos por rol</p>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
          <div><p className="font-semibold text-gray-300 mb-1">Usuario</p><p>Solo puede buscar y abrir links del directorio.</p></div>
          <div><p className="font-semibold text-white mb-1">Administrador</p><p>Acceso total: crea y edita registros, gestiona usuarios y tiene todos los permisos.</p></div>
        </div>
      </div>

      {/* Modal - Nuevo usuario */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-black text-white mb-5">Crear <span className="text-[var(--brand)]">Usuario</span></h2>
            <form onSubmit={createUser} className="space-y-4">
              <div><label className={labelCls}>Nombre completo</label>
                <input value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))} required className={inputCls} /></div>
              <div><label className={labelCls}>Correo electrónico</label>
                <input type="email" value={newForm.email} onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))} required className={inputCls} /></div>
              <div><label className={labelCls}>Contraseña</label>
                <input type="password" value={newForm.password} onChange={(e) => setNewForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} className={inputCls} /></div>
              <div><label className={labelCls}>Rol</label>
                <select value={newForm.role} onChange={(e) => setNewForm((p) => ({ ...p, role: e.target.value }))} className={selectCls}>
                  <option value="VIEWER">Usuario — Solo lectura</option>
                  <option value="EDITOR">Editor — Seguimiento de edición</option>
                  <option value="ADMIN">Administrador — Acceso total</option>
                </select></div>
              {newError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 px-4 py-3 rounded-xl">{newError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={newSaving} className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold py-3 rounded-full text-sm transition-colors disabled:opacity-50">
                  {newSaving ? "Creando..." : "Crear Usuario"}
                </button>
                <button type="button" onClick={() => setNewOpen(false)} className="text-sm font-semibold text-gray-400 hover:text-white border border-[#1f3320] px-5 py-3 rounded-full transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar usuario */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-black text-white mb-5">Editar <span className="text-[var(--brand)]">Usuario</span></h2>
            <div className="space-y-4">
              <div><label className={labelCls}>Nombre</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Rol</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={selectCls}>
                  <option value="VIEWER">Usuario</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Administrador</option>
                </select></div>
              <div><label className={labelCls}>Nueva contraseña (opcional)</label>
                <input type="password" placeholder="Dejar vacío para no cambiar" value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)} className={inputCls} /></div>
              <div className="flex gap-3 pt-1">
                <button onClick={saveEdit} disabled={editSaving} className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold py-3 rounded-full text-sm transition-colors disabled:opacity-50">
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => setEditUser(null)} className="text-sm font-semibold text-gray-400 hover:text-white border border-[#1f3320] px-5 py-3 rounded-full transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
