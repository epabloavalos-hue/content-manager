"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import BackgroundAnimation from "@/components/BackgroundAnimation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      const msg = result.error === "PENDING"
        ? "Tu cuenta está pendiente de aprobación por el administrador."
        : "Credenciales incorrectas. Intenta de nuevo.";
      setError(msg);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#080d08]">
      <BackgroundAnimation />

      {/* Radial glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(74,222,128,0.07) 0%, transparent 70%)", zIndex: 1 }}
      />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand)] mb-4">
            <span className="text-black text-2xl font-black">JS</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Gestor de <span className="text-[var(--brand)]">Contenido</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium tracking-widest uppercase">
            Jorge Serratos
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f1a0f]/80 backdrop-blur border border-[#1f3320] rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#162216] border border-[#1f3320] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#162216] border border-[#1f3320] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-black font-bold py-3 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[var(--brand)] hover:text-white transition-colors font-semibold">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
