"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { DEPARTMENTS, DESTINATION_AREAS } from "@/lib/constants";

type Tab = "perfil" | "usuarios" | "categorias" | "departamentos";

interface UserData {
  id: string; name: string; email: string; role: string; status: string;
  position: string | null; department: string | null; phone: string | null; avatarPath: string | null; notifyArea: string | null;
  createdAt: string;
}

interface Category { id: string; value: string; label: string; order: number }
interface Dept { id: string; value: string; label: string; order: number }
interface HistoryEntry {
  id: string;
  eventName: string;
  destinationArea: string;
  createdAt: string;
  createdBy: { name: string };
  assignments: { userId: string; user: { id: string; name: string } }[];
  acknowledgments: { userId: string }[];
}

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Usuario" },
];

function roleColor(role: string) {
  return role === "ADMIN"
    ? "text-[var(--brand)] border-[var(--brand)]/30 bg-[var(--brand)]/10"
    : "text-gray-400 border-gray-500/30 bg-gray-500/10";
}

function statusColor(s: string) {
  return s === "APPROVED" ? "text-[var(--brand)]" : "text-amber-400";
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [tab, setTab] = useState<Tab>("perfil");

  // — My profile state
  const [me, setMe] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // — Users list
  const [users, setUsers] = useState<UserData[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // — Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [catMsg, setCatMsg] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState("");
  const dragCatIdx = useRef<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  // — Departments
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [newDept, setNewDept] = useState("");
  const [deptMsg, setDeptMsg] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptLabel, setEditingDeptLabel] = useState("");

  // — History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // — Theme / Apariencia
  const [themeAccent, setThemeAccent] = useState("#4ade80");
  const [themeBg, setThemeBg] = useState("default");
  const [themeBgImage, setThemeBgImage] = useState<string | null>(null);
  const [themeAnimation, setThemeAnimation] = useState("rings");
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMsg, setThemeMsg] = useState("");
  const [bgUploading, setBgUploading] = useState(false);

  const fetchMe = useCallback(async () => {
    if (!myId) return;
    const res = await fetch(`/api/users/${myId}`);
    if (res.ok) {
      const data = await res.json();
      setMe(data);
      if (data.themeAccent) setThemeAccent(data.themeAccent);
      if (data.themeBg) setThemeBg(data.themeBg);
      if (data.themeBgImage) setThemeBgImage(data.themeBgImage);
      if (data.themeAnimation) setThemeAnimation(data.themeAnimation);
    }
  }, [myId]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  const fetchDepartments = useCallback(async () => {
    const res = await fetch("/api/admin/departments");
    if (res.ok) setDepartments(await res.json());
  }, []);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/admin/history");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);
  useEffect(() => { if (tab === "usuarios") fetchUsers(); }, [tab, fetchUsers]);
  useEffect(() => { if (tab === "categorias") fetchCategories(); }, [tab, fetchCategories]);
  useEffect(() => { if (tab === "departamentos") fetchDepartments(); }, [tab, fetchDepartments]);

  async function saveProfile() {
    if (!me) return;
    setSaving(true); setProfileMsg("");
    const body = { name: me.name, position: me.position ?? "", department: me.department ?? "", phone: me.phone ?? "", notifyArea: me.notifyArea ?? "" };
    const res = await fetch(`/api/users/${myId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setProfileMsg(res.ok ? "✓ Datos actualizados correctamente" : "Error al guardar");
  }

  async function savePassword() {
    if (!newPassword) { setPwdMsg("Ingresa una nueva contraseña"); return; }
    if (newPassword.length < 6) { setPwdMsg("Mínimo 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { setPwdMsg("Las contraseñas no coinciden"); return; }
    setSavingPwd(true); setPwdMsg("");
    const res = await fetch(`/api/users/${myId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: newPassword }) });
    setSavingPwd(false);
    if (res.ok) { setPwdMsg("✓ Contraseña actualizada"); setNewPassword(""); setConfirmPassword(""); }
    else setPwdMsg("Error al actualizar la contraseña");
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/users/avatar", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setAvatarUploading(false);
    if (res.ok) {
      fetchMe();
      setProfileMsg("✓ Foto actualizada");
    } else {
      setProfileMsg(data.error ?? "Error al subir la foto");
    }
  }

  async function saveTheme() {
    if (!myId) return;
    setSavingTheme(true);
    setThemeMsg("");
    await fetch(`/api/users/${myId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeAccent, themeBg, themeBgImage, themeAnimation }),
    });
    setSavingTheme(false);
    setThemeMsg("✓ Apariencia guardada");
    setTimeout(() => setThemeMsg(""), 2500);
    // Notify ThemeWrapper immediately
    window.dispatchEvent(new CustomEvent("theme-update", { detail: { accent: themeAccent, bg: themeBg, bgImage: themeBgImage, animation: themeAnimation } }));
  }

  async function uploadBg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/users/me/bg-upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setThemeBgImage(data.themeBgImage);
      setThemeBg("image");
      window.dispatchEvent(new CustomEvent("theme-update", { detail: { accent: themeAccent, bg: "image", bgImage: data.themeBgImage, animation: themeAnimation } }));
    }
    setBgUploading(false);
    e.target.value = "";
  }

  async function updateUserRole(userId: string, role: string) {
    await fetch(`/api/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    fetchUsers();
  }

  async function updateUserStatus(userId: string, status: string) {
    await fetch(`/api/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchUsers();
  }

  async function deleteUser(userId: string) {
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    fetchUsers();
  }

  async function addCategory() {
    if (!newCat.trim()) return;
    setCatMsg("");
    const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: newCat }) });
    const data = await res.json();
    if (res.ok) { setNewCat(""); fetchCategories(); } else setCatMsg(data.error);
  }

  async function renameCategory(id: string) {
    if (!editingCatLabel.trim()) return;
    await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, label: editingCatLabel }) });
    setEditingCatId(null);
    fetchCategories();
  }

  async function deleteCategory(id: string) {
    await fetch("/api/admin/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchCategories();
  }

  function onCatDragStart(idx: number) {
    dragCatIdx.current = idx;
  }

  function onCatDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverCatIdx(idx);
  }

  async function onCatDrop(dropIdx: number) {
    const fromIdx = dragCatIdx.current;
    if (fromIdx === null || fromIdx === dropIdx) { setDragOverCatIdx(null); return; }
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setCategories(reordered);
    setDragOverCatIdx(null);
    dragCatIdx.current = null;
    await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
    });
  }

  async function addDepartment() {
    if (!newDept.trim()) return;
    setDeptMsg("");
    const res = await fetch("/api/admin/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: newDept }) });
    const data = await res.json();
    if (res.ok) { setNewDept(""); fetchDepartments(); } else setDeptMsg(data.error);
  }

  async function renameDepartment(id: string) {
    if (!editingDeptLabel.trim()) return;
    await fetch("/api/admin/departments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, label: editingDeptLabel }) });
    setEditingDeptId(null);
    fetchDepartments();
  }

  async function deleteDepartment(id: string) {
    await fetch("/api/admin/departments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchDepartments();
  }

  const tabs: { key: Tab; label: string }[] = isAdmin
    ? [
        { key: "perfil", label: "Mi Perfil" },
        { key: "usuarios", label: "Usuarios" },
        { key: "categorias", label: "Categorías" },
        { key: "departamentos", label: "Departamentos" },
      ]
    : [{ key: "perfil", label: "Mi Perfil" }];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-black text-white mb-6">Configuración</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-[var(--brand)] text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MI PERFIL ── */}
      {tab === "perfil" && me && (
        <div className="space-y-5">

          {/* ── 1. FOTO DE PERFIL ── */}
          <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6">
            <h2 className="font-black text-white text-base mb-5">Foto de perfil</h2>
            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[#162216] border-2 border-[#1f3320] flex items-center justify-center">
                  {me.avatarPath ? (
                    <Image src={`${me.avatarPath}?t=${Date.now()}`} alt={me.name} width={80} height={80} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <span className="text-3xl font-black text-[var(--brand)]">{me.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-1">
                  {me.avatarPath ? "Cambia tu foto actual" : "Sube una foto para personalizar tu perfil"}
                </p>
                <p className="text-xs text-gray-600 mb-3">JPG, PNG o WebP · máx 5 MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black text-xs px-5 py-2.5 rounded-full transition-all disabled:opacity-50"
                >
                  {avatarUploading ? "Subiendo..." : "Seleccionar imagen"}
                </button>
                {profileMsg.includes("Foto") && (
                  <p className={`mt-2 text-xs ${profileMsg.startsWith("✓") ? "text-[var(--brand)]" : "text-red-400"}`}>{profileMsg}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. MIS DATOS ── */}
          <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black text-white text-base">Mis datos</h2>
                <p className="text-xs text-gray-500 mt-0.5">Información visible para el equipo</p>
              </div>
              <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-full ${roleColor(me.role)}`}>
                {ROLES.find(r => r.value === me.role)?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre completo</label>
                <input value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })}
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Correo electrónico</label>
                <input value={me.email} disabled
                  className="w-full bg-[#0a120a] border border-[#1f3320] rounded-xl px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Puesto en la empresa</label>
                <input value={me.position ?? ""} onChange={(e) => setMe({ ...me, position: e.target.value })}
                  placeholder="Ej. Editor de Video"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Teléfono</label>
                <input value={me.phone ?? ""} onChange={(e) => setMe({ ...me, phone: e.target.value })}
                  placeholder="+52 33 1234 5678"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Departamento</label>
                <select value={me.department ?? ""} onChange={(e) => setMe({ ...me, department: e.target.value })}
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)]/50 transition appearance-none"
                  style={{ color: me.department ? "white" : "#4b5563" }}>
                  <option value="">Sin departamento</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value} style={{ color: "white", background: "#162216" }}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Área de notificaciones
                  <span className="ml-1 text-gray-600 normal-case font-normal">— te avisamos cuando llegue contenido para tu área</span>
                </label>
                <select value={me.notifyArea ?? ""} onChange={(e) => setMe({ ...me, notifyArea: e.target.value || null })}
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)]/50 transition appearance-none"
                  style={{ color: me.notifyArea ? "white" : "#4b5563" }}>
                  <option value="">Sin área asignada (ver todo)</option>
                  {DESTINATION_AREAS.map((d) => (
                    <option key={d.value} value={d.value} style={{ color: "white", background: "#162216" }}>{d.label} — {d.contact}</option>
                  ))}
                </select>
              </div>
            </div>

            {profileMsg && !profileMsg.includes("Foto") && !profileMsg.includes("contraseña") && (
              <p className={`text-xs px-3 py-2 rounded-xl border ${profileMsg.startsWith("✓") ? "text-[var(--brand)] bg-[var(--brand)]/5 border-[var(--brand)]/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                {profileMsg}
              </p>
            )}

            <button onClick={saveProfile} disabled={saving}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black py-3 rounded-full transition-all text-sm disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar datos"}
            </button>
          </div>

          {/* ── 2b. APARIENCIA ── */}
          <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="font-black text-white text-base">Apariencia</h2>
              <p className="text-xs text-gray-500 mt-0.5">Personaliza los colores y el fondo de tu sesión</p>
            </div>

            {/* Color accent */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-3">Color de acento</label>
              <div className="flex flex-wrap gap-2.5 mb-3">
                {[
                  { hex: "var(--brand)", name: "Verde" },
                  { hex: "#22d3ee", name: "Cyan" },
                  { hex: "#818cf8", name: "Índigo" },
                  { hex: "#a855f7", name: "Morado" },
                  { hex: "#ec4899", name: "Rosa" },
                  { hex: "#f97316", name: "Naranja" },
                  { hex: "#eab308", name: "Amarillo" },
                  { hex: "#ef4444", name: "Rojo" },
                ].map(({ hex, name }) => (
                  <button
                    key={hex}
                    title={name}
                    onClick={() => setThemeAccent(hex)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: hex,
                      borderColor: themeAccent === hex ? "white" : "transparent",
                      boxShadow: themeAccent === hex ? `0 0 0 3px ${hex}55` : "none",
                      transform: themeAccent === hex ? "scale(1.18)" : "scale(1)",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={themeAccent}
                  onChange={(e) => setThemeAccent(e.target.value)}
                  title="Color personalizado"
                  className="w-8 h-8 rounded-full border-2 border-[#1f3320] cursor-pointer bg-transparent"
                  style={{ padding: "1px" }}
                />
              </div>
              {/* Live preview swatch */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themeAccent }} />
                <span>{themeAccent}</span>
              </div>
            </div>

            {/* Background type */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-3">Fondo</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "default",  label: "Default",   preview: "bg-[#080d08]" },
                  { value: "gradient", label: "Gradiente", preview: "" },
                  { value: "dots",     label: "Puntos",    preview: "" },
                  { value: "mesh",     label: "Malla",     preview: "" },
                  { value: "waves",    label: "Ondas",     preview: "" },
                  { value: "image",    label: "Imagen",    preview: "" },
                ].map(({ value, label }) => {
                  const isSelected = themeBg === value;
                  const previewStyle: React.CSSProperties = (() => {
                    const rgb = themeAccent.startsWith("#")
                      ? `${parseInt(themeAccent.slice(1,3),16)},${parseInt(themeAccent.slice(3,5),16)},${parseInt(themeAccent.slice(5,7),16)}`
                      : "74,222,128";
                    if (value === "gradient") return { background: `radial-gradient(ellipse at 50% 110%, rgba(${rgb},0.5) 0%, transparent 70%)` };
                    if (value === "dots") return { backgroundImage: `radial-gradient(circle, rgba(${rgb},0.6) 1px, transparent 1px)`, backgroundSize: "8px 8px" };
                    if (value === "mesh") return { backgroundImage: `linear-gradient(rgba(${rgb},0.3) 1px, transparent 1px),linear-gradient(90deg, rgba(${rgb},0.3) 1px, transparent 1px)`, backgroundSize: "12px 12px" };
                    if (value === "waves") return { background: `linear-gradient(180deg, transparent 60%, rgba(${rgb},0.3) 100%)` };
                    if (value === "image") return themeBgImage ? { backgroundImage: `url(${themeBgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.7 } : {};
                    return {};
                  })();
                  return (
                    <button
                      key={value}
                      onClick={() => setThemeBg(value)}
                      className={`relative h-16 rounded-xl border-2 transition-all overflow-hidden ${
                        isSelected ? "border-white" : "border-[#1f3320] hover:border-[var(--brand)]/30"
                      }`}
                      style={{ backgroundColor: "#080d08" }}
                    >
                      <div className="absolute inset-0" style={previewStyle} />
                      {value === "image" && !themeBgImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg">🖼</span>
                        </div>
                      )}
                      <span className={`absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold ${isSelected ? "text-white" : "text-gray-500"}`}>
                        {label}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 text-white text-[10px] font-black">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image upload */}
            {themeBg === "image" && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Imagen de fondo</label>
                <label className="flex items-center gap-3 px-4 py-3 bg-[#162216] border border-dashed border-[#1f3320] hover:border-[var(--brand)]/40 rounded-xl cursor-pointer transition-colors group">
                  {themeBgImage ? (
                    <img src={themeBgImage} alt="bg" className="w-12 h-10 object-cover rounded-lg shrink-0" />
                  ) : (
                    <span className="text-2xl shrink-0">🖼</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-300 group-hover:text-[var(--brand)] transition-colors">
                      {bgUploading ? "Subiendo..." : themeBgImage ? "Cambiar imagen" : "Seleccionar imagen"}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">JPG, PNG o WebP · máx 10 MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={uploadBg} disabled={bgUploading} />
                </label>
              </div>
            )}

            {/* Animation selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-3">Animación de fondo</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "rings",     label: "Anillos",    icon: "◎" },
                  { value: "particles", label: "Partículas", icon: "·:·" },
                  { value: "waves",     label: "Ondas",      icon: "〜" },
                  { value: "spiral",    label: "Espiral",    icon: "🌀" },
                  { value: "grid",      label: "Cuadrícula", icon: "⊞" },
                  { value: "stars",     label: "Estrellas",  icon: "✦" },
                  { value: "pulse",     label: "Pulso",      icon: "◉" },
                  { value: "none",      label: "Sin anim.",  icon: "—" },
                ].map(({ value, label, icon }) => {
                  const isSelected = themeAnimation === value;
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setThemeAnimation(value);
                        window.dispatchEvent(new CustomEvent("theme-update", { detail: { accent: themeAccent, bg: themeBg, bgImage: themeBgImage, animation: value } }));
                      }}
                      className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl border-2 transition-all ${
                        isSelected ? "border-white bg-white/5" : "border-[#1f3320] hover:border-[#4ade80]/30"
                      }`}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span className={`text-[10px] font-bold ${isSelected ? "text-white" : "text-gray-500"}`}>{label}</span>
                      {isSelected && <span className="absolute text-white text-[9px] font-black top-1 right-1.5">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {themeMsg && (
              <p className="text-xs text-[var(--brand)] bg-[var(--brand)]/5 border border-[var(--brand)]/20 px-3 py-2 rounded-xl">{themeMsg}</p>
            )}

            <button
              onClick={saveTheme}
              disabled={savingTheme}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black py-3 rounded-full transition-all text-sm disabled:opacity-60"
            >
              {savingTheme ? "Guardando..." : "Guardar apariencia"}
            </button>
          </div>

          {/* ── 3. CONTRASEÑA ── */}
          <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="font-black text-white text-base">Actualizar contraseña</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mínimo 6 caracteres</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nueva contraseña</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Confirmar contraseña</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
              </div>
            </div>

            {pwdMsg && (
              <p className={`text-xs px-3 py-2 rounded-xl border ${pwdMsg.startsWith("✓") ? "text-[var(--brand)] bg-[var(--brand)]/5 border-[var(--brand)]/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                {pwdMsg}
              </p>
            )}

            <button onClick={savePassword} disabled={savingPwd}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black py-3 rounded-full transition-all text-sm disabled:opacity-60">
              {savingPwd ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>

        </div>
      )}

      {/* ── USUARIOS ── */}
      {tab === "usuarios" && isAdmin && (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#162216] border border-[#1f3320] flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatarPath
                    ? <Image src={u.avatarPath} alt={u.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                    : <span className="text-[var(--brand)] font-black">{u.name[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{u.name} {u.id === myId && <span className="text-[10px] text-gray-500 font-normal">(tú)</span>}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  {u.position && <p className="text-[11px] text-gray-600 truncate">{u.position}</p>}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status badge/toggle */}
                <button
                  onClick={() => u.id !== myId && updateUserStatus(u.id, u.status === "APPROVED" ? "PENDING" : "APPROVED")}
                  disabled={u.id === myId}
                  className={`text-[11px] font-bold border px-2.5 py-1 rounded-full transition-all ${statusColor(u.status)} border-current/30 bg-current/5 ${u.id !== myId ? "hover:opacity-70 cursor-pointer" : "cursor-default"}`}
                >
                  {u.status === "APPROVED" ? "✓ Activo" : "⏳ Pendiente"}
                </button>

                {/* Role selector */}
                <select
                  value={u.role}
                  disabled={u.id === myId}
                  onChange={(e) => updateUserRole(u.id, e.target.value)}
                  className={`bg-[#162216] border border-[#1f3320] rounded-full px-3 py-1 text-xs font-bold focus:outline-none focus:border-[var(--brand)]/50 transition ${roleColor(u.role)} ${u.id === myId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#162216", color: "white" }}>{r.label}</option>)}
                </select>

                {/* Notify area selector */}
                <select
                  value={u.notifyArea ?? ""}
                  onChange={(e) => {
                    fetch(`/api/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifyArea: e.target.value || null }) });
                    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, notifyArea: e.target.value || null } : x));
                  }}
                  className="bg-[#162216] border border-[#1f3320] rounded-full px-3 py-1 text-xs text-gray-300 font-semibold focus:outline-none focus:border-[var(--brand)]/50 transition max-w-[140px]"
                >
                  <option value="" style={{ background: "#162216" }}>Sin área</option>
                  {DESTINATION_AREAS.map(d => (
                    <option key={d.value} value={d.value} style={{ background: "#162216", color: "white" }}>{d.label}</option>
                  ))}
                </select>

                {u.id !== myId && (
                  confirmDeleteId === u.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">¿Confirmar?</span>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-[11px] font-black text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded-full transition-all"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[11px] font-bold text-gray-400 hover:text-white border border-[#1f3320] px-2.5 py-1 rounded-full transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(u.id)}
                      className="text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
                    >
                      Eliminar
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CATEGORÍAS ── */}
      {tab === "categorias" && isAdmin && (
        <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6">
          <h2 className="font-bold text-white mb-1">Categorías de eventos</h2>
          <p className="text-xs text-gray-500 mb-6">Estas categorías aparecen al crear o filtrar registros.</p>

          <div className="flex gap-2 mb-6">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="Ej. Talleres"
              className="flex-1 bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
            <button onClick={addCategory}
              className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black px-5 py-2.5 rounded-full text-sm transition-all">
              + Añadir
            </button>
          </div>

          {catMsg && <p className="text-red-400 text-xs mb-4">{catMsg}</p>}

          <ul className="space-y-2">
            {categories.map((c, idx) => (
              <li
                key={c.id}
                draggable
                onDragStart={() => onCatDragStart(idx)}
                onDragOver={(e) => onCatDragOver(e, idx)}
                onDrop={() => onCatDrop(idx)}
                onDragLeave={() => setDragOverCatIdx(null)}
                className={`bg-[#162216] border rounded-xl px-4 py-3 transition-all ${
                  dragOverCatIdx === idx ? "border-[var(--brand)]/60 bg-[#1a2e1a]" : "border-[#1f3320]"
                }`}
              >
                {editingCatId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editingCatLabel}
                      onChange={(e) => setEditingCatLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") renameCategory(c.id); if (e.key === "Escape") setEditingCatId(null); }}
                      className="flex-1 bg-[#0f1a0f] border border-[var(--brand)]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                    />
                    <button onClick={() => renameCategory(c.id)}
                      className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black text-xs font-black px-3 py-1.5 rounded-full transition-all">
                      Guardar
                    </button>
                    <button onClick={() => setEditingCatId(null)}
                      className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-all">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* drag handle */}
                      <span className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing select-none shrink-0" title="Arrastar para reordenar">
                        ⠿
                      </span>
                      <div>
                        <p className="text-white text-sm font-semibold">{c.label}</p>
                        <p className="text-[11px] text-gray-600 font-mono mt-0.5">{c.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingCatId(c.id); setEditingCatLabel(c.label); }}
                        className="text-gray-400 hover:text-white text-xs border border-[#1f3320] hover:border-[var(--brand)]/30 px-3 py-1 rounded-full transition-all font-semibold">
                        Renombrar
                      </button>
                      <button onClick={() => deleteCategory(c.id)}
                        className="text-red-400 hover:text-red-300 text-xs border border-red-500/20 hover:border-red-500/40 px-3 py-1 rounded-full transition-all font-semibold">
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {categories.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Sin categorías registradas</p>}
          </ul>
        </div>
      )}

      {/* ── DEPARTAMENTOS ── */}
      {tab === "departamentos" && isAdmin && (
        <div className="bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-6">
          <h2 className="font-bold text-white mb-1">Departamentos</h2>
          <p className="text-xs text-gray-500 mb-6">Áreas que aparecen en el perfil de los usuarios al registrarse.</p>

          <div className="flex gap-2 mb-6">
            <input value={newDept} onChange={(e) => setNewDept(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDepartment()}
              placeholder="Ej. Producción"
              className="flex-1 bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--brand)]/50 transition" />
            <button onClick={addDepartment}
              className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black px-5 py-2.5 rounded-full text-sm transition-all">
              + Añadir
            </button>
          </div>

          {deptMsg && <p className="text-red-400 text-xs mb-4">{deptMsg}</p>}

          <ul className="space-y-2">
            {departments.map((d) => (
              <li key={d.id} className="bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-3">
                {editingDeptId === d.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editingDeptLabel}
                      onChange={(e) => setEditingDeptLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") renameDepartment(d.id); if (e.key === "Escape") setEditingDeptId(null); }}
                      className="flex-1 bg-[#0f1a0f] border border-[var(--brand)]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                    />
                    <button onClick={() => renameDepartment(d.id)}
                      className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black text-xs font-black px-3 py-1.5 rounded-full transition-all">
                      Guardar
                    </button>
                    <button onClick={() => setEditingDeptId(null)}
                      className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-all">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-semibold">{d.label}</p>
                      <p className="text-[11px] text-gray-600 font-mono mt-0.5">{d.value}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingDeptId(d.id); setEditingDeptLabel(d.label); }}
                        className="text-gray-400 hover:text-white text-xs border border-[#1f3320] hover:border-[var(--brand)]/30 px-3 py-1 rounded-full transition-all font-semibold">
                        Renombrar
                      </button>
                      <button onClick={() => deleteDepartment(d.id)}
                        className="text-red-400 hover:text-red-300 text-xs border border-red-500/20 hover:border-red-500/40 px-3 py-1 rounded-full transition-all font-semibold">
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {departments.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Sin departamentos registrados</p>}
          </ul>
        </div>
      )}

    </div>
  );
}
