"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationsPanel from "@/components/NotificationsPanel";
import InstallButton from "@/components/InstallButton";

interface NavbarProps {
  user: { name?: string; email?: string; role?: string };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user.role === "ADMIN";

  const roleLabel =
    user.role === "ADMIN" ? "Administrador" : user.role === "EDITOR" ? "Editor" : "Usuario";

  function isActive(href: string) {
    return pathname === href;
  }

  return (
    <>
      <header className="border-b border-[#1f3320] bg-[#080d08]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">

          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--brand)] flex items-center justify-center">
                <span className="text-black text-xs font-black">JS</span>
              </div>
              <span className="hidden sm:block font-bold text-white text-sm tracking-tight">
                Gestor de <span className="text-[var(--brand)]">Contenido</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive("/dashboard")
                    ? "bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Directorio
              </Link>

              {isAdmin && (
                <Link
                  href="/dashboard/admin/users"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pathname.startsWith("/dashboard/admin")
                      ? "bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Usuarios
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/dashboard/historial"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pathname.startsWith("/dashboard/historial")
                      ? "bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Historial
                </Link>
              )}
            </nav>
          </div>

          {/* Right side: install + bell + user + logout */}
          <div className="flex items-center gap-2">
            <InstallButton />
            {/* Notification bell */}
            <button
              onClick={() => setPanelOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full border border-[#1f3320] hover:border-[var(--brand)]/40 hover:bg-[var(--brand)]/5 transition-all"
              title="Notificaciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`w-4 h-4 ${unreadCount > 0 ? "text-[var(--brand)]" : "text-gray-400"}`}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--brand)] text-black text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User info — click to profile */}
            <Link href="/dashboard/profile" className="hidden sm:block text-right ml-1 hover:opacity-80 transition-opacity">
              <p className="text-sm font-semibold text-white leading-none">{user.name}</p>
              <p className="text-xs text-[var(--brand)] mt-0.5">{roleLabel}</p>
            </Link>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" }).then(() => router.push("/login"))}
              className="text-xs font-semibold text-gray-400 hover:text-white border border-[#1f3320] hover:border-[var(--brand)]/30 px-3 py-1.5 rounded-full transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <NotificationsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCountChange={setUnreadCount}
        isAdmin={isAdmin}
      />
    </>
  );
}
