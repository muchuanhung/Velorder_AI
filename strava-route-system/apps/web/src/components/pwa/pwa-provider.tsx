"use client";

import { useEffect, useState } from "react";

/** 註冊 Service Worker */
function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);
}

/** PWA 安裝提示 - 僅在未安裝時顯示 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  useServiceWorker();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsIOS(ios);
    setIsStandalone(standalone);
    // iOS 無 beforeinstallprompt，直接顯示加入主畫面提示（若未曾關閉）
    if (ios && !standalone && !localStorage.getItem("pwa-install-dismissed")) {
      setShowInstallPrompt(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("pwa-install-dismissed")) setShowInstallPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowInstallPrompt(false);
    }
  };

  const dismiss = () => {
    setShowInstallPrompt(false);
    try {
      localStorage.setItem("pwa-install-dismissed", "1");
    } catch {}
  };

  // 已安裝或非支援環境不顯示
  if (isStandalone || !showInstallPrompt) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">將 Routecast 加入主畫面</p>
            {isIOS ? (
              <p className="mt-1 text-sm text-muted-foreground">
                點選分享按鈕 <span className="inline-block">⎋</span>，然後選擇「加入主畫面」
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">像 App 一樣使用，更快更方便</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {!isIOS && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                安裝
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              稍後
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
