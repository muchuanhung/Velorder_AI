/**
 * 入口頁背景「山腰之字坡」的動態層。
 *
 * 山、樹、路與前景遮擋樹是預先輸出的圖片（public/landing/dawn-*.webp，產生方式見 scripts/landing-scene/）；
 * 這裡只畫會動的部分：光束、雲影、山霧、大冠鷲、路面樹影、判定色帶、示警點、車友，以及固定的里程牌與示警卡。
 * 座標一律用設計稿單位：寬 1600、高 1000（與圖片相同比例），由呼叫端負責縮放與裁切。
 */

export const DESIGN_W = 1600;
export const DESIGN_H = 1000;

type Pt = [number, number];
type Level = "go" | "slow" | "unknown" | "stop";

const LEVEL_COLOR: Record<Level, string> = { go: "#3E9F69", slow: "#e3a53a", stop: "#c4483f", unknown: "#a9ada4" };
/** 0–20K 每 4K 一段的判定（示意） */
const LEVELS: Level[] = ["go", "go", "slow", "unknown", "stop"];
const ROUTE_KM = 20;

type EventKind = "work" | "nodata" | "rock";
/** TDX 示警與缺資料的位置（示意），side 為標示卡在路的哪一側，dy 為垂直位移 */
const EVENTS: { km: number; kind: EventKind; label: string; side: 1 | -1; dy: number }[] = [
  { km: 9.6, kind: "work", label: "TDX 施工・單線通行", side: 1, dy: 74 },
  { km: 14, kind: "nodata", label: "缺資料・未判定", side: -1, dy: -58 },
  { km: 17.8, kind: "rock", label: "TDX 落石・封閉", side: -1, dy: -86 },
];
const EVENT_RGB: Record<EventKind, string> = { rock: "196,72,63", work: "232,116,44", nodata: "143,148,140" };

/** 山路控制點（佔寬度與高度的比例），和產生靜態圖時相同 */
const ROAD_CTRL: Pt[] = [
  [0.5, 1090], [0.47, 970], [0.6, 905], [0.63, 862], [0.49, 805], [0.46, 765],
  [0.58, 708], [0.605, 672], [0.52, 625], [0.505, 594], [0.565, 553], [0.555, 505],
];
const SUN: Pt = [DESIGN_W * 0.54, 205];

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
  leaves: CanvasImageSource;
}

export interface DawnFonts {
  sans: string;
  mono: string;
}

/**
 * 畫一格。ctx 須已轉換到設計稿座標（1600×1000）。
 * t：開場後經過的秒數；reduce：減少動態效果時傳 true，畫判定與示警都完成的靜態畫面。
 */
export function drawDawnFrame(ctx: CanvasRenderingContext2D, img: DawnImages, g: DawnGeometry, t: number, reduce: boolean, fonts: DawnFonts) {
  const W = DESIGN_W, H = DESIGN_H, S = g.road, N = g.normals, T = reduce ? 6 : t;
  const [sx, sy] = SUN;
  ctx.drawImage(img.bg, 0, 0, W, H);

  // 光束：角度與亮度緩慢變化，整體強弱也會呼吸
  const breathe = 0.75 + 0.25 * Math.sin(T * 0.16);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 12; i++) {
    const a = 0.15 + i * 0.255 + Math.sin(T * 0.06 + i * 0.7) * 0.05, len = 1600, spread = 0.02 + hash(i + 1) * 0.03;
    const alpha = (0.03 + 0.035 * (0.5 + 0.5 * Math.sin(T * 0.4 + i * 1.3))) * breathe;
    const grad = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    grad.addColorStop(0, `rgba(255,240,200,${alpha * 2.2})`);
    grad.addColorStop(0.55, `rgba(255,240,200,${alpha})`);
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
  ctx.font = `600 14px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let s = 0; s <= LEVELS.length; s++) {
    const j = indexAt(s * 4);
    if (j > prog + 0.5) break;
    const p = S[j]!, n = N[j]!, r = roadWidth(p[1]), side = n[0] >= 0 ? 1 : -1;
    const x = p[0] + n[0] * r * 0.9 * side + side * 20, y = p[1] + n[1] * r * 0.9 * side;
    ctx.fillStyle = "rgba(251,250,244,.95)";
    ctx.beginPath();
    ctx.roundRect(x - 21, y - 11, 42, 22, 5);
    ctx.fill();
    ctx.fillStyle = "#1f2b20";
    ctx.fillText(`${s * 4}K`, x, y + 1);
  }

  // 示警卡（固定不動）
  EVENTS.forEach((e) => {
    const j = indexAt(e.km);
    if (j > prog) return;
    const [px, py] = lane(j, 0.22), r = roadWidth(S[j]![1]), side = e.side, appear = reduce ? 1 : clamp01((prog - j) / 12);
    const lx = px + side * (side < 0 ? r * 0.9 + 44 : r * 1.2 + 70), ly = py + e.dy;
    ctx.globalAlpha = appear;
    ctx.strokeStyle = "rgba(251,250,244,.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(lx - side * 24, ly);
    ctx.stroke();
    ctx.font = `600 13px ${fonts.sans}`;
    const text = `${e.label}\u3000${e.km}K`, tw = ctx.measureText(text).width;
    const bx = side > 0 ? lx - 22 : lx - tw - 52;
    ctx.fillStyle = "rgba(251,250,244,.96)";
    ctx.beginPath();
    ctx.roundRect(bx, ly - 17, tw + 74, 34, 8);
    ctx.fill();
    drawSign(ctx, e.kind, bx + 20, ly, 22, fonts.mono);
    ctx.fillStyle = "#1f2b20";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bx + 40, ly + 1);
    ctx.globalAlpha = 1;
  });

  // 右下前景葉片隨風擺動
  const pivot: Pt = [W * 0.985, 1020], sway = Math.sin(T * 0.9) * 0.022 + Math.sin(T * 2.3) * 0.007;
  ctx.save();
  ctx.translate(pivot[0], pivot[1]);
  ctx.rotate(sway);
  ctx.translate(-pivot[0], -pivot[1]);
  ctx.drawImage(img.leaves, 0, 0, W, H);
  ctx.restore();

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

function drawSign(ctx: CanvasRenderingContext2D, kind: EventKind, x: number, y: number, s: number, mono: string) {
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
    // 缺資料：灰色問號
    ctx.fillStyle = "#fbfaf2";
    ctx.strokeStyle = "#8f948c";
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5b6058";
    ctx.font = `800 ${s * 0.62}px ${mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", x, y + s * 0.03);
  }
}
