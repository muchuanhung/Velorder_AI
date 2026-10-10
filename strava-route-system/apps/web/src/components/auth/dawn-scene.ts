/**
 * 入口頁背景「山腰之字坡」的動態層。
 *
 * 山、樹、路與前景遮擋樹是預先輸出的圖片（public/landing/dawn-*.webp，產生方式見 scripts/landing-scene/）；
 * 這裡只畫會動的部分：光束、雲影、山霧、大冠鷲、路面樹影、判定色帶、示警點、車友，以及固定的里程牌與示警卡。
 * 座標一律用設計稿單位：寬 1600、高 1000（與圖片相同比例），由呼叫端負責縮放與裁切。
 */

import params from "@/components/auth/dawn-scene-params.json";

export const DESIGN_W = 1600;
export const DESIGN_H = 1000;

type Pt = [number, number];
type Level = "go" | "slow" | "unknown" | "stop";

const LEVEL_COLOR: Record<Level, string> = { go: "#3E9F69", slow: "#e3a53a", stop: "#c4483f", unknown: "#a9ada4" };

type EventKind = "work" | "rain" | "rock";
/**
 * 場景參數與 scripts/landing-scene/scene.html（產生靜態圖）共用同一份 JSON，改這裡兩邊都會跟著變；
 * 改完路線或標示位置要重跑 render.mjs 更新手機靜態圖。
 */
// JSON 匯入的型別是寬鬆的 number[]／string，這裡收窄成場景用的型別
const P = params as unknown as {
  routeKm: number;
  /** 0–20K 每 4K 一段的判定（示意） */
  levels: Level[];
  /** TDX、氣象署示警的位置（示意），side 為標示卡在路的哪一側，dx、dy 為水平、垂直位移 */
  events: { km: number; kind: EventKind; label: string; side: 1 | -1; dx?: number; dy: number }[];
  /** 個別里程牌的位移 [dx, dy]，避免被登入卡蓋住 */
  mileLabelOffset: Record<string, Pt>;
  /** 山路控制點：x 為寬度比例、y 為設計稿座標 */
  roadCtrl: Pt[];
  sun: Pt;
};
const LEVELS = P.levels;
const ROUTE_KM = P.routeKm;
const EVENTS = P.events;
const EVENT_RGB: Record<EventKind, string> = { rock: "196,72,63", work: "232,116,44", rain: "58,120,184" };
const ROAD_CTRL = P.roadCtrl;
const SUN: Pt = [DESIGN_W * P.sun[0], P.sun[1]];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function catmull(pts: Pt[], per: number): Pt[] {
  const out: Pt[] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]!;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const f = (k: 0 | 1) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(at(pts.length - 1));
  return out;
}

export interface DawnGeometry {
  road: Pt[];
  normals: Pt[];
  roadPath: Path2D;
}

const roadWidth = (y: number) => lerp(10, 60, clamp01((y - 470) / 620));

export function createGeometry(): DawnGeometry {
  const road = catmull(ROAD_CTRL.map(([x, y]) => [x * DESIGN_W, y] as Pt), 24);
  const normals = road.map((_, i) => {
    const a = road[Math.max(0, i - 1)]!, b = road[Math.min(road.length - 1, i + 1)]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });
  const roadPath = new Path2D();
  road.forEach((p, i) => {
    const r = roadWidth(p[1]), n = normals[i]!;
    if (i) roadPath.lineTo(p[0] - n[0] * r * 0.5, p[1] - n[1] * r * 0.5);
    else roadPath.moveTo(p[0] - n[0] * r * 0.5, p[1] - n[1] * r * 0.5);
  });
  for (let i = road.length - 1; i >= 0; i--) {
    const p = road[i]!, r = roadWidth(p[1]), n = normals[i]!;
    roadPath.lineTo(p[0] + n[0] * r * 0.5, p[1] + n[1] * r * 0.5);
  }
  roadPath.closePath();
  return { road, normals, roadPath };
}

export interface DawnImages {
  bg: CanvasImageSource;
  front: CanvasImageSource;
}

export interface DawnFonts {
  sans: string;
  mono: string;
}

const MILE_LABEL_HALF_W = 21, MILE_LABEL_HALF_H = 11;
const CARD_H = 34;

/** 設計稿座標的矩形 */
export interface DawnRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * 標示要避開的區域（設計稿座標）：covers 為蓋在畫布上的 HTML（登入卡、左欄文字與精選路線），
 * view 為畫面實際看得到的範圍（裁切後）。
 */
export interface DawnAvoid {
  covers: DawnRect[];
  view: DawnRect;
}

const roadIndexAt = (g: DawnGeometry, km: number) => {
  const last = g.road.length - 1;
  return Math.min(last, Math.round((km / ROUTE_KM) * last));
};

/** 路面上判定色帶那條線的位置（示警點、車友都畫在這條線上） */
const laneAt = (g: DawnGeometry, i: number, off: number): Pt => {
  const p = g.road[i]!, n = g.normals[i]!, r = roadWidth(p[1]);
  return [p[0] + n[0] * r * off, p[1] + n[1] * r * off];
};

/**
 * 里程牌中心點（設計稿座標）：預設放在路的外側並套 mileLabelOffset；flip 時改放到路的另一側（不套位移）。
 */
function mileLabelCenter(g: DawnGeometry, km: number, flip = false): Pt {
  const j = roadIndexAt(g, km);
  const p = g.road[j]!, n = g.normals[j]!, r = roadWidth(p[1]), side = (n[0] >= 0 ? 1 : -1) * (flip ? -1 : 1);
  const [ox, oy] = flip ? [0, 0] : (P.mileLabelOffset[km] ?? [0, 0]);
  return [p[0] + n[0] * r * 0.9 * side + side * 20 + ox, p[1] + n[1] * r * 0.9 * side + oy];
}

const mileRect = ([x, y]: Pt): DawnRect => ({
  left: x - MILE_LABEL_HALF_W,
  top: y - MILE_LABEL_HALF_H,
  right: x + MILE_LABEL_HALF_W,
  bottom: y + MILE_LABEL_HALF_H,
});

/**
 * 和 band 垂直範圍重疊的里程牌中，預設位置最右緣的 x（設計稿座標）；呼叫端據此把場景往左推，讓路線右側露在登入卡左側。
 * 沒有重疊的里程牌時回傳 null。
 */
export function mileLabelsRightEdge(g: DawnGeometry, band: { top: number; bottom: number }): number | null {
  let right: number | null = null;
  for (let s = 0; s <= LEVELS.length; s++) {
    const r = mileRect(mileLabelCenter(g, s * 4));
    if (r.bottom > band.top && r.top < band.bottom) right = Math.max(right ?? -Infinity, r.right);
  }
  return right;
}

const overlapArea = (a: DawnRect, b: DawnRect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

const inflate = (r: DawnRect, d: number): DawnRect => ({ left: r.left - d, top: r.top - d, right: r.right + d, bottom: r.bottom + d });

/** 線段穿過矩形（取樣判斷，標示尺寸遠大於取樣間距） */
function segmentHits(a: Pt, b: Pt, r: DawnRect) {
  for (let i = 0; i <= 24; i++) {
    const x = lerp(a[0], b[0], i / 24), y = lerp(a[1], b[1], i / 24);
    if (x > r.left && x < r.right && y > r.top && y < r.bottom) return true;
  }
  return false;
}

interface CardPlacement {
  /** 示警點 */
  px: number;
  py: number;
  /** 引線接到卡片的那一端 */
  lx: number;
  ly: number;
  /** 卡片左緣與寬度 */
  bx: number;
  w: number;
  text: string;
}

interface LabelLayout {
  cards: CardPlacement[];
  /** null：放不下（會被蓋住或超出畫面），不畫 */
  miles: (Pt | null)[];
}

/** 被蓋住、超出畫面或重疊時的基本罰分；最低代價仍達此值代表沒有可放的位置 */
const HIT = 10_000;

/**
 * 示警卡與里程牌的位置：每個標示有幾個候選位置，依序挑代價最低的——
 * 被 HTML 蓋住、超出畫面、和已放好的標示或引線重疊代價最高，蓋到路面其次，離預設位置越遠代價越高。
 * 示警卡先放（字多），再放里程牌。
 */
function layoutLabels(ctx: CanvasRenderingContext2D, g: DawnGeometry, fonts: DawnFonts, avoid: DawnAvoid | undefined): LabelLayout {
  const placed: DawnRect[] = [];
  const leaders: [Pt, Pt][] = [];
  const roadPts = g.road.filter((_, i) => i % 3 === 0);
  const cost = (rect: DawnRect, leader: [Pt, Pt] | null, roadWeight: number) => {
    // 被蓋住、超出畫面、和其他標示重疊：只要沾到一點就重罰，幾乎等同禁止
    const hit = (area: number) => (area > 0 ? HIT + area * 50 : 0);
    let c = 0;
    if (avoid) {
      for (const cv of avoid.covers) c += hit(overlapArea(inflate(rect, 6), cv));
      const v = avoid.view, area = (rect.right - rect.left) * (rect.bottom - rect.top);
      c += hit(area - overlapArea(rect, inflate(v, -6)));
    }
    for (const r of placed) c += hit(overlapArea(inflate(rect, 6), r));
    for (const [a, b] of leaders) if (segmentHits(a, b, inflate(rect, 4))) c += 3000;
    if (leader) for (const r of placed) if (segmentHits(leader[0], leader[1], r)) c += 3000;
    for (const p of roadPts) if (p[0] > rect.left && p[0] < rect.right && p[1] > rect.top && p[1] < rect.bottom) c += roadWeight;
    return c;
  };

  ctx.font = `600 13px ${fonts.sans}`;
  const cards = EVENTS.map((e) => {
    const j = roadIndexAt(g, e.km);
    const [px, py] = laneAt(g, j, 0.22), r = roadWidth(g.road[j]![1]), side = e.side;
    const baseX = px + side * (side < 0 ? r * 0.9 + 44 : r * 1.2 + 70) + (e.dx ?? 0), baseY = py + e.dy;
    const text = `${e.label}\u3000${e.km}K`, tw = ctx.measureText(text).width, w = tw + 74;
    let best: { c: number; card: CardPlacement; rect: DawnRect; leader: [Pt, Pt] } | null = null;
    for (const ddy of [0, -20, 20, -40, 40, -60, 60, -80, 80, -110, 110, -140, 140]) {
      for (const ddx of [0, 30, 60, 90, -30, -60, -90]) {
        const lx = baseX + ddx, ly = baseY + ddy, bx = side > 0 ? lx - 22 : lx - tw - 52;
        const rect = { left: bx, top: ly - CARD_H / 2, right: bx + w, bottom: ly + CARD_H / 2 };
        const leader: [Pt, Pt] = [[px, py], [lx - side * 24, ly]];
        const c = cost(rect, leader, 60) + Math.abs(ddx) * 0.5 + Math.abs(ddy) * 0.5;
        if (!best || c < best.c) best = { c, card: { px, py, lx, ly, bx, w, text }, rect, leader };
      }
    }
    placed.push(best!.rect);
    leaders.push(best!.leader);
    return best!.card;
  });

  const miles: (Pt | null)[] = [];
  for (let s = 0; s <= LEVELS.length; s++) {
    const km = s * 4, j = roadIndexAt(g, km), p = g.road[j]!, gap = roadWidth(p[1]) * 0.5 + MILE_LABEL_HALF_H + 6;
    const bases: Pt[] = [mileLabelCenter(g, km), mileLabelCenter(g, km, true), [p[0], p[1] - gap], [p[0], p[1] + gap]];
    let best: { c: number; pt: Pt } | null = null;
    bases.forEach((b, bi) => {
      for (const d of [0, -14, 14, -28, 28, -42, 42]) {
        for (const dx of [0, -24, 24, -48, 48, -72]) {
          const pt: Pt = [b[0] + dx, b[1] + d], c = cost(mileRect(pt), null, 15) + bi * 40 + Math.abs(d) + Math.abs(dx);
          if (!best || c < best.c) best = { c, pt };
        }
      }
    });
    // 怎麼放都會被蓋住或超出畫面（例如起點在畫面下緣外）就不畫，避免只露出半個
    if (best!.c >= HIT) {
      miles.push(null);
      continue;
    }
    placed.push(mileRect(best!.pt));
    miles.push(best!.pt);
  }
  return { cards, miles };
}

let layoutCache: { key: string; g: DawnGeometry; layout: LabelLayout } | null = null;

/** 同一組避讓區域只算一次；畫面縮放或 HTML 位置改變時才重算 */
function cachedLayout(ctx: CanvasRenderingContext2D, g: DawnGeometry, fonts: DawnFonts, avoid: DawnAvoid | undefined) {
  const key = JSON.stringify([fonts, avoid && [avoid.view, avoid.covers].flat().map((r) => [r.left, r.top, r.right, r.bottom].map(Math.round))]);
  if (layoutCache?.key !== key || layoutCache.g !== g) layoutCache = { key, g, layout: layoutLabels(ctx, g, fonts, avoid) };
  return layoutCache.layout;
}

/**
 * 畫一格。ctx 須已轉換到設計稿座標（1600×1000）。
 * t：開場後經過的秒數；reduce：減少動態效果時傳 true，畫判定與示警都完成的靜態畫面。
 * avoid：標示要避開的 HTML 區域與畫面範圍，見 layoutLabels。
 */
export function drawDawnFrame(
  ctx: CanvasRenderingContext2D,
  img: DawnImages,
  g: DawnGeometry,
  t: number,
  reduce: boolean,
  fonts: DawnFonts,
  avoid?: DawnAvoid
) {
  const W = DESIGN_W, H = DESIGN_H, S = g.road, N = g.normals, T = reduce ? 6 : t;
  const [sx, sy] = SUN;
  ctx.drawImage(img.bg, 0, 0, W, H);

  // 光束：整束緩慢擺動，每道光各自搖曳、寬窄與亮度起伏，並有一段亮光沿著光束往外流；整體強弱也會呼吸
  const breathe = 0.75 + 0.25 * Math.sin(T * 0.16);
  const fan = Math.sin(T * 0.05) * 0.05;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 12; i++) {
    const a = 0.15 + i * 0.255 + fan + Math.sin(T * 0.22 + i * 0.7) * 0.035, len = 1600;
    const spread = (0.02 + hash(i + 1) * 0.03) * (0.8 + 0.4 * (0.5 + 0.5 * Math.sin(T * 0.5 + i * 2.3)));
    const alpha = (0.02 + 0.06 * (0.5 + 0.5 * Math.sin(T * 0.6 + i * 1.3))) * breathe;
    // 沿光束的基本亮度：光源處最亮，往外漸淡
    const base = (u: number) => (u < 0.55 ? lerp(alpha * 2.2, alpha, u / 0.55) : lerp(alpha, 0, (u - 0.55) / 0.45));
    // 流動亮帶的位置：每道光速度相同、起點錯開，在 0.15–0.85 之間循環
    const phase = T * 0.08 + hash(i + 7), m = 0.15 + 0.7 * (phase - Math.floor(phase));
    const grad = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    grad.addColorStop(0, `rgba(255,240,200,${base(0)})`);
    grad.addColorStop(m - 0.12, `rgba(255,240,200,${base(m - 0.12)})`);
    grad.addColorStop(m, `rgba(255,240,200,${base(m) + alpha * 1.2})`);
    grad.addColorStop(m + 0.12, `rgba(255,240,200,${base(m + 0.12)})`);
    grad.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a - spread) * len, sy + Math.sin(a - spread) * len);
    ctx.lineTo(sx + Math.cos(a + spread) * len, sy + Math.sin(a + spread) * len);
    ctx.fill();
  }
  ctx.restore();

  // 雲影掠過山稜與山坡
  ([[0, 300, 1], [800, 470, 0.85], [1400, 650, 1.15], [400, 820, 1.3]] as const).forEach(([o, y, s], i) => {
    const x = ((T * (15 + i * 4) + o) % (W + 1300)) - 650;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 330 * s);
    grad.addColorStop(0, "rgba(16,34,34,.24)");
    grad.addColorStop(1, "rgba(16,34,34,0)");
    ellipseFill(ctx, x, y, 1.8, 0.5, grad, 350 * s);
  });

  // 山谷霧氣：三條山谷各兩到三層，速度不同、忽濃忽淡
  ([[350, 3, 8], [460, 3, 11], [575, 2, 14]] as const).forEach(([vy, n, sp], vi) => {
    for (let i = 0; i < n; i++) {
      const y = vy + i * 18 + Math.sin(T * 0.22 + i + vi) * 7, x = ((T * (sp + i * 2.5) + i * 520 + vi * 300) % (W + 1100)) - 550;
      const al = 0.22 + 0.22 * (0.5 + 0.5 * Math.sin(T * 0.28 + i * 2.1 + vi * 1.3));
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 540);
      grad.addColorStop(0, `rgba(240,243,236,${al})`);
      grad.addColorStop(1, "rgba(240,243,236,0)");
      ellipseFill(ctx, x, y, 1, 0.15, grad, 560);
    }
  });

  // 大冠鷲盤旋
  ctx.strokeStyle = "rgba(38,46,50,.8)";
  ctx.lineCap = "round";
  ctx.lineWidth = 2.2;
  ([[0.38, 360, 70, 0, 10], [0.72, 300, 50, 2.6, 8]] as const).forEach(([fx, cy, rr, ph, s]) => {
    const a = T * 0.17 + ph, x = W * fx + Math.cos(a) * rr * 1.7, y = cy + Math.sin(a) * rr * 0.45, tilt = Math.cos(a) * 0.3;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.7, y + tilt * s);
    ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.4, x, y);
    ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.4, x + s * 1.7, y - tilt * s);
    ctx.stroke();
  });

  // 路面樹影晃動
  ctx.save();
  ctx.clip(g.roadPath);
  ctx.fillStyle = "rgba(10,20,15,.3)";
  for (let i = 0; i < 70; i++) {
    const p = S[Math.floor(hash(i * 11 + 1) * S.length)]!, r = roadWidth(p[1]);
    const x = p[0] + (hash(i) - 0.5) * r + Math.sin(T * 1.3 + i) * r * 0.05;
    const y = p[1] + (hash(i + 3) - 0.5) * r * 0.4 + Math.cos(T * 1.1 + i) * r * 0.025;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.12 + hash(i + 5) * 0.28), r * 0.07, 0.4 + Math.sin(T * 0.8 + i) * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 逐段判定色帶：約 14 秒畫完
  const last = S.length - 1, seg = last / LEVELS.length, prog = reduce ? last : clamp01((t - 0.5) / 14) * last;
  const lane = (i: number, off: number): Pt => {
    const p = S[i]!, n = N[i]!, r = roadWidth(p[1]);
    return [p[0] + n[0] * r * off, p[1] + n[1] * r * off];
  };
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.88;
  for (let i = 0; i < Math.floor(prog); i++) {
    const level = LEVELS[Math.min(LEVELS.length - 1, Math.floor(i / seg))]!;
    if (level === "unknown" && i % 3) continue;
    const a = lane(i, 0.22), b = lane(i + 1, 0.22);
    ctx.strokeStyle = LEVEL_COLOR[level];
    ctx.lineWidth = roadWidth(S[i]![1]) * 0.24;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const indexAt = (km: number) => Math.min(last, Math.round((km / ROUTE_KM) * last));
  // 示警點（在路面上，會被前景樹擋住）
  EVENTS.forEach((e, n) => {
    const j = indexAt(e.km);
    if (j > prog) return;
    const [px, py] = lane(j, 0.22), appear = reduce ? 1 : clamp01((prog - j) / 12), pulse = reduce ? 0.5 : (T * 0.5 + n * 0.33) % 1;
    ctx.strokeStyle = `rgba(${EVENT_RGB[e.kind]},${(1 - pulse) * 0.8 * appear})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 6 + pulse * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(${EVENT_RGB[e.kind]},${appear})`;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 車友：沿路往上騎，一趟約 30 秒，到山頂淡出、山腳淡入
  ([["#e9739a", 0], ["#4aa3d8", 0.035], ["#f2f2ea", 0.07]] as const).forEach(([jersey, lag]) => {
    const u = reduce ? 0.3 - lag : (((t * 0.03 - lag) % 1) + 1) % 1;
    const fade = clamp01(Math.min(u / 0.04, (1 - u) / 0.06));
    const j = Math.min(last - 1, Math.floor(u * last)), [x, y] = lane(j, 0.2), s = roadWidth(S[j]![1]) * 0.14;
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(10,20,15,.35)";
    ctx.beginPath();
    ctx.ellipse(x + s * 0.8, y + s * 0.6, s * 1.4, s * 0.45, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1d2124";
    ctx.beginPath();
    ctx.ellipse(x, y + s * 0.3, s * 0.35, s * 1.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = jersey;
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.3, s * 0.75, s * 0.9, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4f4ee";
    ctx.beginPath();
    ctx.arc(x - s * 0.3, y - s * 0.95, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // 前景遮擋層：擋在路前面的樹，蓋住路線與車友
  ctx.drawImage(img.front, 0, 0, W, H);

  // 里程牌（固定不動）
  const labels = cachedLayout(ctx, g, fonts, avoid);
  ctx.font = `600 14px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let s = 0; s <= LEVELS.length; s++) {
    if (indexAt(s * 4) > prog + 0.5) break;
    const pt = labels.miles[s];
    if (!pt) continue;
    const [x, y] = pt;
    ctx.fillStyle = "rgba(251,250,244,.95)";
    ctx.beginPath();
    ctx.roundRect(x - MILE_LABEL_HALF_W, y - MILE_LABEL_HALF_H, MILE_LABEL_HALF_W * 2, MILE_LABEL_HALF_H * 2, 5);
    ctx.fill();
    ctx.fillStyle = "#1f2b20";
    ctx.fillText(`${s * 4}K`, x, y + 1);
  }

  // 示警卡（固定不動）
  EVENTS.forEach((e, n) => {
    const j = indexAt(e.km);
    if (j > prog) return;
    const { px, py, lx, ly, bx, w, text } = labels.cards[n]!, side = e.side, appear = reduce ? 1 : clamp01((prog - j) / 12);
    ctx.globalAlpha = appear;
    ctx.strokeStyle = "rgba(251,250,244,.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(lx - side * 24, ly);
    ctx.stroke();
    ctx.font = `600 13px ${fonts.sans}`;
    ctx.fillStyle = "rgba(251,250,244,.96)";
    ctx.beginPath();
    ctx.roundRect(bx, ly - CARD_H / 2, w, CARD_H, 8);
    ctx.fill();
    drawSign(ctx, e.kind, bx + 20, ly, 22);
    ctx.fillStyle = "#1f2b20";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + 40, ly + 1);
    ctx.globalAlpha = 1;
  });

  // 晨光暖色微微起伏
  const warm = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.8);
  warm.addColorStop(0, `rgba(255,222,160,${0.12 + 0.05 * Math.sin(T * 0.25)})`);
  warm.addColorStop(1, "rgba(255,222,160,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
}

/** 以 (x, y) 為中心、橫縱縮放後填滿一塊放射漸層（雲影、山霧用） */
function ellipseFill(ctx: CanvasRenderingContext2D, x: number, y: number, sxScale: number, syScale: number, fill: CanvasGradient, half: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sxScale, syScale);
  ctx.translate(-x, -y);
  ctx.fillStyle = fill;
  ctx.fillRect(x - half, y - half, half * 2, half * 2);
  ctx.restore();
}

function drawSign(ctx: CanvasRenderingContext2D, kind: EventKind, x: number, y: number, s: number) {
  if (kind === "rock") {
    // 紅框三角警告牌＋落石
    ctx.fillStyle = "#fbfaf2";
    ctx.strokeStyle = "#c4483f";
    ctx.lineWidth = s * 0.14;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.62);
    ctx.lineTo(x + s * 0.6, y + s * 0.42);
    ctx.lineTo(x - s * 0.6, y + s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2b2a28";
    ([[-0.12, 0.05, 0.11], [0.1, 0.18, 0.09], [-0.02, 0.28, 0.08], [0.18, -0.05, 0.06]] as const).forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (kind === "work") {
    // 施工三角錐
    ctx.fillStyle = "#e8742c";
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.6);
    ctx.lineTo(x + s * 0.34, y + s * 0.36);
    ctx.lineTo(x - s * 0.34, y + s * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fbfaf2";
    ctx.fillRect(x - s * 0.2, y - s * 0.12, s * 0.4, s * 0.12);
    ctx.fillRect(x - s * 0.27, y + s * 0.1, s * 0.54, s * 0.11);
    ctx.fillStyle = "#3b3f42";
    ctx.fillRect(x - s * 0.46, y + s * 0.36, s * 0.92, s * 0.1);
  } else {
    // 大雨：雲朵＋雨滴
    ctx.fillStyle = "#7d8a94";
    ([[-0.2, -0.08, 0.24], [0.06, -0.2, 0.3], [0.28, -0.04, 0.22]] as const).forEach(([dx, dy, r]) => {
      ctx.beginPath();
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillRect(x - s * 0.2, y - s * 0.08, s * 0.48, s * 0.22);
    ctx.strokeStyle = "#3a78b8";
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = "round";
    ([-0.18, 0.04, 0.26] as const).forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * s, y + s * 0.26);
      ctx.lineTo(x + (dx - 0.07) * s, y + s * 0.46);
      ctx.stroke();
    });
  }
}
