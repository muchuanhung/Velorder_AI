"use client";

import { useEffect, useRef } from "react";
import {
  createGeometry,
  drawDawnFrame,
  DESIGN_H,
  DESIGN_W,
  mileLabelsRightEdge,
  type DawnImages,
  type DawnRect,
} from "@/components/auth/dawn-scene";

const SRC = { bg: "/landing/dawn-bg.webp", front: "/landing/dawn-front.webp" } as const;
/** 畫面比例和設計稿不同時，垂直方向依這個比例裁切（多裁天空、保留山路） */
const ANCHOR_Y = 0.6;
const DESKTOP = "(min-width: 1024px)";
/** 里程牌右緣和登入卡左緣至少留的距離（CSS px） */
const CARD_GAP = 16;
/** 登入卡（LoginView 標上 data-auth-card），場景依它的位置往左推 */
const CARD_SELECTOR = "[data-auth-card]";
/**
 * 示警卡、里程牌要避開的 HTML：data-scene-avoid="text" 取裡面每一行文字的範圍（文字旁的空白仍可放標示），
 * "box" 取整個元素（例如有底色的精選路線卡片）。
 */
const AVOID_TEXT = '[data-scene-avoid="text"]', AVOID_BOX = '[data-scene-avoid="box"]';

/** 頁面上要避開的區域（CSS px，相對 viewport） */
function avoidRects(): DOMRect[] {
  const rects: DOMRect[] = [];
  document.querySelectorAll(AVOID_BOX).forEach((el) => rects.push(el.getBoundingClientRect()));
  document.querySelectorAll(AVOID_TEXT).forEach((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim() || (n.parentElement && n.parentElement.closest(AVOID_BOX))) continue;
      range.selectNodeContents(n);
      rects.push(...Array.from(range.getClientRects()));
    }
  });
  return rects.filter((r) => r.width > 0 && r.height > 0);
}

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
    let images: DawnImages | null = null, raf = 0, start = 0, cancelled = false, settle = 0;

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1), r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    };
    /**
     * 等比放大到蓋滿畫布後置中。頁面變高（例如精選路線撐高左欄）時放大倍率變大，路線右側會滑進登入卡底下，
     * 所以在仍蓋滿畫布的範圍內把場景往左推；示警卡與里程牌再由 drawDawnFrame 依 avoid 避開登入卡、左欄文字與彼此。
     */
    const layout = () => {
      const cw = canvas.width, ch = canvas.height, s = Math.max(cw / DESIGN_W, ch / DESIGN_H);
      const ty = (ch - DESIGN_H * s) * ANCHOR_Y, center = (cw - DESIGN_W * s) / 2;
      const r = canvas.getBoundingClientRect();
      const card = document.querySelector(CARD_SELECTOR)?.getBoundingClientRect();
      if (!card || card.width === 0 || r.width === 0) return { s, tx: center, ty, avoid: undefined };
      const k = cw / r.width;
      const toDesignY = (y: number) => ((y - r.top) * k - ty) / s;
      const limit = (card.left - r.left - CARD_GAP) * k;
      const right = mileLabelsRightEdge(geometry, { top: toDesignY(card.top), bottom: toDesignY(card.bottom) });
      const tx = right === null ? center : Math.max(cw - DESIGN_W * s, Math.min(center, limit - right * s));
      const toDesign = (b: { left: number; top: number; right: number; bottom: number }): DawnRect => ({
        left: ((b.left - r.left) * k - tx) / s,
        top: ((b.top - r.top) * k - ty) / s,
        right: ((b.right - r.left) * k - tx) / s,
        bottom: ((b.bottom - r.top) * k - ty) / s,
      });
      // 登入卡往右延伸到畫面外：卡片右側的窄縫也不放標示
      const cardRect = toDesign({ left: card.left - CARD_GAP, top: card.top, right: r.right + 1000, bottom: card.bottom });
      const covers = [cardRect, ...avoidRects().map(toDesign)];
      const view = toDesign({ left: r.left, top: r.top, right: r.right, bottom: Math.min(r.bottom, r.top + window.innerHeight) });
      return { s, tx, ty, avoid: { covers, view } };
    };
    const draw = (t: number) => {
      if (!images) return;
      const { s, tx, ty, avoid } = layout();
      ctx.setTransform(s, 0, 0, s, tx, ty);
      drawDawnFrame(ctx, images, geometry, t, reduce, fonts, avoid);
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
        if (reduce) {
          draw(0);
          // 靜態畫面只畫一次；左欄與登入卡的進場位移結束後再畫一次，標示依最終位置避讓
          settle = window.setTimeout(() => draw(0), 1000);
        } else {
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
      clearTimeout(settle);
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
