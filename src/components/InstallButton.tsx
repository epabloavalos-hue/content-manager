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
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-[#0f1a0f] border border-[#1f3320] rounded-2xl p-5 shadow-2xl max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-black text-lg">Instalar app</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Sigue estos 3 pasos en Safari</p>
                </div>
                <button onClick={() => setShowIOSGuide(false)} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full border border-[#1f3320] text-sm transition-colors shrink-0">✕</button>
              </div>
              <ol className="space-y-4">
                <li className="flex items-center gap-3 bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand)] text-black text-sm font-black flex items-center justify-center">1</span>
                  <span className="text-sm text-gray-300">Toca <strong className="text-white">Compartir</strong> <span className="text-base">⎙</span> abajo en Safari</span>
                </li>
                <li className="flex items-center gap-3 bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand)] text-black text-sm font-black flex items-center justify-center">2</span>
                  <span className="text-sm text-gray-300">Elige <strong className="text-white">"Agregar a inicio"</strong></span>
                </li>
                <li className="flex items-center gap-3 bg-[#162216] border border-[#1f3320] rounded-xl px-4 py-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand)] text-black text-sm font-black flex items-center justify-center">3</span>
                  <span className="text-sm text-gray-300">Toca <strong className="text-white">"Agregar"</strong> arriba a la derecha</span>
                </li>
              </ol>
              <button onClick={() => setShowIOSGuide(false)} className="w-full mt-5 bg-[var(--brand)] text-black font-black py-2.5 rounded-full text-sm">
                Entendido
              </button>
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
