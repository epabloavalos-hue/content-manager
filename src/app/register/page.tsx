"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import { DEPARTMENTS } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, position, department, phone }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) { setError(data.error ?? "Error al crear la cuenta. Intenta de nuevo."); return; }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12">
      <BackgroundAnimation />
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-[var(--brand)]/6 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand)] mb-4">
            <span className="text-black font-black text-xl">JS</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Gestor de Contenido · Jorge Serratos</p>
        </div>

        <div className="bg-[#0f1a0f]/90 backdrop-blur border border-[#1f3320] rounded-2xl p-8 shadow-2xl">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre completo *</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Rebeca Robles"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Puesto en la empresa</label>
                <input
                  type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                  placeholder="Ej. Editora de Video"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Departamento</label>
                <select
                  value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--brand)]/50 transition appearance-none"
                  style={{ color: department ? "white" : "#4b5563" }}
                >
                  <option value="" disabled>Selecciona tu área</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value} style={{ color: "white", background: "#162216" }}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Teléfono</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +52 33 1234 5678"
                  className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50 transition"
                />
              </div>

              <div className="border-t border-[#1f3320] pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Correo electrónico *</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@empresa.com"
                    className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contraseña *</label>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[var(--brand)]/50 transition"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                type="submit" disabled={submitting}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black py-3 rounded-full transition-all text-sm disabled:opacity-60 mt-2"
              >
                {submitting ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[var(--brand)]/10 border border-[var(--brand)]/30 flex items-center justify-center mx-auto">
                <span className="text-[var(--brand)] text-2xl">✓</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-white mb-2">¡Solicitud enviada!</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Tu cuenta fue creada. Un administrador debe{" "}
                  <strong className="text-white">aprobar tu acceso</strong> antes de que puedas entrar al sistema.
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400 text-left">
                <p className="font-bold mb-1">¿Qué sigue?</p>
                <p>El administrador recibirá una notificación y revisará tu solicitud. Una vez aprobada podrás iniciar sesión normalmente.</p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-black py-3 rounded-full transition-all text-sm"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}
        </div>

        {!done && (
          <p className="text-center text-xs text-gray-600 mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[var(--brand)] hover:text-white transition-colors font-semibold">
              Iniciar sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
