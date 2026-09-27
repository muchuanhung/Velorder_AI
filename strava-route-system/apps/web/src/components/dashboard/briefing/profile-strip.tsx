import type { Hazard } from "@/lib/routes/recon-geo";

const W = 1000;
const H = 120;
const PAD_TOP = 8;
/** 伺服器端直接輸出 SVG path，點數壓到約 200 以控制 HTML 大小 */
const MAX_POINTS = 200;

function downsample(points: [number, number][]): [number, number][] {
  if (points.length <= MAX_POINTS) return points;
  const step = (points.length - 1) / (MAX_POINTS - 1);
  return Array.from({ length: MAX_POINTS }, (_, i) => points[Math.round(i * step)]!);
}

/**
 * 海拔剖面＋示警區段（天氣與路況事件）。
 * 示警帶用狀態色半透明底，文字等級另由示警清單提供，不只靠顏色。
 */
export function ProfileStrip({
  profile,
  distanceKm,
  hazards,
}: {
  profile: [number, number][];
  distanceKm: number;
  hazards: Hazard[];
}) {
  const pts = downsample(profile);
  if (pts.length < 2 || distanceKm <= 0) return null;

  const eles = pts.map(([, e]) => e);
  const minE = Math.min(...eles);
  const maxE = Math.max(...eles);
  const span = Math.max(maxE - minE, 50);
  const x = (km: number) => (km / distanceKm) * W;
  const y = (e: number) => PAD_TOP + (1 - (e - minE) / span) * (H - PAD_TOP);

  const line = pts.map(([km, e], i) => `${i ? "L" : "M"}${x(km).toFixed(1)},${y(e).toFixed(1)}`).join("");
  const area = `${line}L${W},${H}L0,${H}Z`;

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-24 w-full sm:h-28"
        role="img"
        aria-label={`海拔剖面，最低 ${Math.round(minE)} 公尺、最高 ${Math.round(maxE)} 公尺`}
      >
        {hazards.map((h) => (
          <rect
            key={h.id}
            x={x(h.startKm)}
            y={0}
            width={Math.max(x(h.endKm) - x(h.startKm), 4)}
            height={H}
            className={h.level === "risky" ? "fill-destructive/20" : "fill-warning/25"}
          />
        ))}
        <path d={area} className="fill-primary/10" />
        <path d={line} className="fill-none stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>0 km</span>
        <span>
          {Math.round(minE)}–{Math.round(maxE)} m
        </span>
        <span>{distanceKm.toFixed(1)} km</span>
      </figcaption>
    </figure>
  );
}
