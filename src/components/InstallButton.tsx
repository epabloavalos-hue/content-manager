"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;
  if (!prompt && !isIOS) return null;

  async function handleInstall() {
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstalling(false);
  }

  const btnClass =
    "flex items-center gap-1.5 text-xs font-bold text-[var(--brand)] border border-[var(--brand)]/40 hover:bg-[var(--brand)]/10 px-3 py-1.5 rounded-full transition-all disabled:opacity-50";

  const DownloadIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );

  if (isIOS) {
    return (
      <>
        <button onClick={() => setShowIOSGuide(true)} className={btnClass}>
          <DownloadIcon />
          Instalar
        </button>

        {showIOSGuide && (
          <>
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)} />
            <div className="fixed bottom-6 left-4 right-4 z-50 bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-5 shadow-2xl max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-black text-base">Instalar app</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-full border border-[#1f3320] text-sm transition-colors">✕</button>
              </div>
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand)] text-black text-xs font-black flex items-center justify-center mt-0.5">1</span>
                  <span>Toca el botón de <strong className="text-white">Compartir</strong> en Safari <span className="text-lg">⎙</span> (barra inferior del navegador)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand)] text-black text-xs font-black flex items-center justify-center mt-0.5">2</span>
                  <span>Desplázate y toca <strong className="text-white">"Agregar a pantalla de inicio"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand)] text-black text-xs font-black flex items-center justify-center mt-0.5">3</span>
                  <span>Toca <strong className="text-white">"Agregar"</strong> en la esquina superior derecha</span>
                </li>
              </ol>
              <p className="text-xs text-gray-600 mt-4 text-center">Solo funciona desde Safari en iPhone/iPad</p>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <button onClick={handleInstall} disabled={installing} className={btnClass}>
      <DownloadIcon />
      {installing ? "..." : "Instalar"}
    </button>
  );
}
