"use client";

import { useEffect, useRef } from "react";
import { createGeometry, drawDawnFrame, DESIGN_H, DESIGN_W, mileLabelsRightEdge, type DawnImages } from "@/components/auth/dawn-scene";

const SRC = { bg: "/landing/dawn-bg.webp", front: "/landing/dawn-front.webp" } as const;
/** 畫面比例和設計稿不同時，垂直方向依這個比例裁切（多裁天空、保留山路） */
const ANCHOR_Y = 0.6;
const DESKTOP = "(min-width: 1024px)";
/** 里程牌右緣和登入卡左緣至少留的距離（CSS px） */
const CARD_GAP = 16;
/** 登入卡（LoginView 標上 data-auth-card），場景依它的位置往左推 */
const CARD_SELECTOR = "[data-auth-card]";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 入口頁桌機滿版背景：山腰之字坡。
 * 圖片載入前先顯示 CSS 背景圖；系統開啟「減少動態效果」時只畫一張靜態畫面；手機不載入（手機用頂部靜態圖）。
 */
export function DawnSceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.matchMedia(DESKTOP).matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const fonts = {
      sans: css.getPropertyValue("--font-noto-sans-tc").trim() || "sans-serif",
      mono: css.getPropertyValue("--font-chivo-mono").trim() || "monospace",
    };
    const geometry = createGeometry();
    let images: DawnImages | null = null, raf = 0, start = 0, cancelled = false;

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1), r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    };
    /**
     * 等比放大到蓋滿畫布後置中。頁面變高（例如精選路線撐高左欄）時放大倍率變大，路線右側的里程牌會滑進登入卡底下，
     * 所以在仍蓋滿畫布的範圍內把場景往左推；推到底仍被蓋住的里程牌，由 drawDawnFrame 改畫到路的另一側。
     */
    const layout = () => {
      const cw = canvas.width, ch = canvas.height, s = Math.max(cw / DESIGN_W, ch / DESIGN_H);
      const ty = (ch - DESIGN_H * s) * ANCHOR_Y, center = (cw - DESIGN_W * s) / 2;
      const card = document.querySelector(CARD_SELECTOR)?.getBoundingClientRect();
      const r = canvas.getBoundingClientRect();
      if (!card || card.width === 0 || r.width === 0) return { s, tx: center, ty, cover: undefined };
      const k = cw / r.width;
      const toDesignY = (y: number) => ((y - r.top) * k - ty) / s;
      const band = { top: toDesignY(card.top), bottom: toDesignY(card.bottom) };
      const limit = (card.left - r.left - CARD_GAP) * k, right = mileLabelsRightEdge(geometry, band);
      const tx = right === null ? center : Math.max(cw - DESIGN_W * s, Math.min(center, limit - right * s));
      return { s, tx, ty, cover: { left: (limit - tx) / s, ...band } };
    };
    const draw = (t: number) => {
      if (!images) return;
      const { s, tx, ty, cover } = layout();
      ctx.setTransform(s, 0, 0, s, tx, ty);
      drawDawnFrame(ctx, images, geometry, t, reduce, fonts, cover);
    };
    const loop = (now: number) => {
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(canvas);

    Promise.all([loadImage(SRC.bg), loadImage(SRC.front)])
      .then(([bg, front]) => {
        if (cancelled) return;
        images = { bg, front };
        canvas.style.opacity = "1";
        if (reduce) draw(0);
        else {
          start = performance.now();
          raf = requestAnimationFrame(loop);
        }
      })
      .catch(() => {
        // 圖片載不到就只留 CSS 背景圖
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden bg-cover lg:block"
      style={{ backgroundImage: `url(${SRC.bg})`, backgroundPosition: `50% ${ANCHOR_Y * 100}%` }}
    >
      <canvas ref={canvasRef} className="h-full w-full opacity-0 transition-opacity duration-700" />
      {/* 深色模式：壓暗背景，讓淺色文字與卡片讀得清楚 */}
      <div className="absolute inset-0 hidden bg-[#0b1410]/55 dark:block" />
    </div>
  );
}
