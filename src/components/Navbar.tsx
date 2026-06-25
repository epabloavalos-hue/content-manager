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

const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconFolder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 100-4 2 2 0 000 4zM3 16a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user.role === "ADMIN";
  const roleLabel =
    user.role === "ADMIN" ? "Administrador" : user.role === "EDITOR" ? "Editor" : "Usuario";

  const navLinks = [
    { href: "/dashboard", label: "Directorio", icon: <IconHome />, exact: true },
    { href: "/dashboard/carpetas-importantes", label: "Carpetas", icon: <IconFolder />, exact: false },
    ...(isAdmin ? [
      { href: "/dashboard/admin/users", label: "Usuarios", icon: <IconUsers />, exact: false },
      { href: "/dashboard/historial", label: "Historial", icon: <IconClock />, exact: false },
    ] : []),
  ];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <>
      {/* ── TOP HEADER ── */}
      <header className="border-b border-[#1f3320] bg-[#080d08]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">

          {/* Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[var(--brand)] flex items-center justify-center">
                <span className="text-black text-xs font-black">JS</span>
              </div>
              <span className="hidden sm:block font-bold text-white text-sm tracking-tight">
                Gestor de <span className="text-[var(--brand)]">Contenido</span>
              </span>
            </Link>

            {/* Desktop nav tabs — hidden on mobile */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive(link.href, link.exact)
                      ? "bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label === "Carpetas" ? "Carpetas Importantes" : link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <InstallButton />

            {/* Bell */}
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

            {/* User info — desktop only */}
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

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#080d08]/95 backdrop-blur border-t border-[#1f3320] flex items-stretch">
        {navLinks.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                active ? "text-[var(--brand)]" : "text-gray-500"
              }`}
            >
              {link.icon}
              <span className="text-[10px] font-semibold leading-none">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <NotificationsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCountChange={setUnreadCount}
        isAdmin={isAdmin}
      />
    </>
  );
}
