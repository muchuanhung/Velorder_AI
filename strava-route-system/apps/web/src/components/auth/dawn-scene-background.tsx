"use client";

import { useEffect, useRef } from "react";
import { createGeometry, drawDawnFrame, DESIGN_H, DESIGN_W, type DawnImages } from "@/components/auth/dawn-scene";

const SRC = { bg: "/landing/dawn-bg.webp", front: "/landing/dawn-front.webp", leaves: "/landing/dawn-leaves.webp" } as const;
/** 畫面比例和設計稿不同時，垂直方向依這個比例裁切（多裁天空、保留山路） */
const ANCHOR_Y = 0.6;
const DESKTOP = "(min-width: 1024px)";

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
    const draw = (t: number) => {
      if (!images) return;
      const s = Math.max(canvas.width / DESIGN_W, canvas.height / DESIGN_H);
      ctx.setTransform(s, 0, 0, s, (canvas.width - DESIGN_W * s) / 2, (canvas.height - DESIGN_H * s) * ANCHOR_Y);
      drawDawnFrame(ctx, images, geometry, t, reduce, fonts);
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

    Promise.all([loadImage(SRC.bg), loadImage(SRC.front), loadImage(SRC.leaves)])
      .then(([bg, front, leaves]) => {
        if (cancelled) return;
        images = { bg, front, leaves };
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
