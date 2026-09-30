"use client";
/* eslint-disable react/no-unknown-property -- R3F 的 JSX 元素是 three.js 物件，args／castShadow 等屬性由 R3F 解析，不是 DOM 屬性 */

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls, useCursor } from "@react-three/drei";
import * as THREE from "three";
import type { Route } from "@/lib/routes/route-data";
import type { CctvMarker, Hazard } from "@/lib/routes/recon-geo";
import { buildRoutePolylineKm } from "@/lib/routes/recon-geo";
import { createLocalProjection } from "@/lib/geo/local-projection";
import {
  CONTOUR_STEP_M,
  prepareHeights,
  quantize,
  sampleHeight,
  type TerrainGrid,
} from "@/lib/lab/terrain";

/* 紙板等高：每 30 m 一層，低地草澤 → 淺山林綠 → 稜線岩土 */
const RAMP = [
  "#D9DFC4", "#C7D2AC", "#B2C494", "#9BB27F", "#86A06C", "#74905C", "#64814F", "#577349",
  "#6E7D55", "#847F5F", "#8F836A", "#998A74", "#A3937E", "#AB9B88", "#B3A492", "#BAAC9C",
  "#C1B5A6", "#C7BCAF", "#CDC3B8", "#D2C9C0", "#D7CFC7", "#DBD4CD", "#DFD9D3", "#E2DDD8",
  "#E5E1DC", "#E8E4E0", "#EBE8E4", "#EEEBE8",
];
const ROUTE_COLOR = { ok: "#2F5D3E", caution: "#D97706", risky: "#991B1B" };
const CUT_COLOR = "#C9BEA6";
const PLINTH_COLOR = "#AE9F87";
const INK = "#1F2B20";
const EXAGGERATION = 1.7;
/** 拖曳超過這個像素就視為旋轉，不當點擊 */
const CLICK_TOLERANCE_PX = 6;

export interface TerrainSceneProps {
  route: Route;
  /** null＝地形載入中：Canvas 保持掛載、只清空場景，避免換路線時整個畫布卸載重建 */
  terrain: TerrainGrid | null;
  /** 判定用示警（天氣）：路線依此著色，與剖面、示警清單一致 */
  hazards: Hazard[];
  markers: CctvMarker[];
  positionKm: number;
  activeMarkerId: string | null;
  onPickMarker: (marker: CctvMarker) => void;
  onPickKm: (km: number) => void;
  /** 手機：地形降一半解析度、限制像素比，省電 */
  lowDetail?: boolean;
}

export default function TerrainScene(props: TerrainSceneProps) {
  return (
    <Canvas
      shadows
      // 按需渲染：只在拖曳、播放頭移動或資料改變時重繪；靜止時不耗電
      frameloop="demand"
      dpr={props.lowDetail ? [1, 1.5] : [1, 2]}
      camera={{ fov: 44, near: 0.05, far: 200 }}
      gl={{ antialias: true, alpha: true }}
      fallback={<p className="p-6 text-sm text-muted-foreground">此裝置不支援 3D，請使用下方剖面圖。</p>}
    >
      {props.terrain && <SceneContent {...props} terrain={props.terrain} />}
    </Canvas>
  );
}

const yOf = (e: number) => (e / 1000) * EXAGGERATION;
/** 單點示警（路況事件）沒有長度，前後各延伸一點才看得到 */
const POINT_HAZARD_HALF_KM = 0.2;

/** 該里程最嚴重的示警等級 */
function levelAtKm(hazards: Hazard[], km: number): keyof typeof ROUTE_COLOR {
  let level: keyof typeof ROUTE_COLOR = "ok";
  for (const h of hazards) {
    const pad = h.endKm > h.startKm ? 0 : POINT_HAZARD_HALF_KM;
    if (km < h.startKm - pad || km > h.endKm + pad) continue;
    if (h.level === "risky") return "risky";
    level = "caution";
  }
  return level;
}

/** 地形、台座、路線的幾何：只在路線、地形或示警改變時重建 */
function buildModel(route: Route, terrain: TerrainGrid, lowDetail: boolean, hazards: Hazard[]) {
  const proj = createLocalProjection(terrain.bbox);
  const exX = proj.widthKm;
  const exZ = proj.depthKm;
  const { heights, max } = prepareHeights(terrain);
  const { w, h } = terrain.grid;

  // ── 地形 ──
  const s = lowDetail ? 2 : 1;
  const gw = Math.floor((w - 1) / s) + 1;
  const gh = Math.floor((h - 1) / s) + 1;
  const terrainGeo = new THREE.PlaneGeometry(exX, exZ, gw - 1, gh - 1);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position!;
  const levels = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      const e = quantize(heights[Math.min(h - 1, j * s) * w + Math.min(w - 1, i * s)]!);
      levels[k] = e;
      pos.setY(k, yOf(e));
    }
  }
  terrainGeo.computeVertexNormals();
  const normals = terrainGeo.attributes.normal!;
  const colors = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  for (let k = 0; k < pos.count; k++) {
    const band = Math.min(RAMP.length - 1, Math.round(levels[k]! / CONTOUR_STEP_M));
    tmp.set(RAMP[band]!).multiplyScalar(0.82 + 0.22 * normals.getY(k));
    colors.set([tmp.r, tmp.g, tmp.b], k * 3);
  }
  terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // ── 台座切邊（模型的側牆） ──
  const px = (i: number) => -exX / 2 + (i * exX) / (gw - 1);
  const pz = (j: number) => -exZ / 2 + (j * exZ) / (gh - 1);
  const rim: [number, number][] = [];
  for (let i = 0; i < gw; i++) rim.push([i, 0]);
  for (let j = 1; j < gh; j++) rim.push([gw - 1, j]);
  for (let i = gw - 2; i >= 0; i--) rim.push([i, gh - 1]);
  for (let j = gh - 2; j >= 1; j--) rim.push([0, j]);
  const skirtPos: number[] = [];
  for (let a = 0; a < rim.length; a++) {
    const [i1, j1] = rim[a]!;
    const [i2, j2] = rim[(a + 1) % rim.length]!;
    const t1: [number, number, number] = [px(i1), yOf(levels[j1 * gw + i1]!), pz(j1)];
    const t2: [number, number, number] = [px(i2), yOf(levels[j2 * gw + i2]!), pz(j2)];
    const b1: [number, number, number] = [px(i1), 0, pz(j1)];
    const b2: [number, number, number] = [px(i2), 0, pz(j2)];
    skirtPos.push(...t1, ...b1, ...t2, ...t2, ...b1, ...b2);
  }
  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(skirtPos, 3));
  skirtGeo.computeVertexNormals();

  // ── 路線：貼地、依示警著色（與判定同一套等級） ──
  const poly = buildRoutePolylineKm(route);
  const lift = (lowDetail ? 0.03 : 0.016) * EXAGGERATION;
  const routePts = (poly?.points ?? []).map(([lat, lon]) => {
    const e = quantize(sampleHeight(heights, terrain, lat, lon));
    return new THREE.Vector3(proj.x(lon), yOf(e) + lift, proj.z(lat));
  });
  const kms = poly?.cumulativeKm ?? [];

  let routeGeo: THREE.TubeGeometry | null = null;
  if (routePts.length >= 2) {
    const tubular = Math.min(1500, routePts.length * 3);
    const radial = 8;
    routeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(routePts), tubular, lowDetail ? 0.06 : 0.042, radial);
    // TubeGeometry 以弧長取樣，換算成里程再查該處示警
    const totalKm = kms[kms.length - 1] ?? 0;
    const vcols = new Float32Array(routeGeo.attributes.position!.count * 3);
    const c = new THREE.Color();
    for (let seg = 0; seg <= tubular; seg++) {
      c.set(ROUTE_COLOR[levelAtKm(hazards, (seg / tubular) * totalKm)]);
      for (let r = 0; r <= radial; r++) vcols.set([c.r, c.g, c.b], (seg * (radial + 1) + r) * 3);
    }
    routeGeo.setAttribute("color", new THREE.BufferAttribute(vcols, 3));
  }

  const box = new THREE.Box3().setFromPoints(routePts.length ? routePts : [new THREE.Vector3()]);
  const center = box.getCenter(new THREE.Vector3());
  return { exX, exZ, max, terrainGeo, skirtGeo, routeGeo, routePts, kms, center };
}

type Model = ReturnType<typeof buildModel>;

function positionAtKm(model: Model, km: number): THREE.Vector3 {
  const { kms, routePts } = model;
  if (routePts.length === 0) return new THREE.Vector3();
  if (km <= 0) return routePts[0]!.clone();
  let lo = 0;
  let hi = kms.length - 1;
  if (km >= kms[hi]!) return routePts[hi]!.clone();
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (kms[mid]! <= km) lo = mid;
    else hi = mid;
  }
  const span = kms[hi]! - kms[lo]!;
  const t = span > 0 ? (km - kms[lo]!) / span : 0;
  return new THREE.Vector3().lerpVectors(routePts[lo]!, routePts[hi]!, t);
}

function nearestKm(model: Model, point: THREE.Vector3): number {
  let best = 0;
  let bestD = Infinity;
  model.routePts.forEach((p, i) => {
    const d = p.distanceToSquared(point);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return model.kms[best] ?? 0;
}

function SceneContent({
  route,
  terrain,
  hazards,
  markers,
  positionKm,
  activeMarkerId,
  onPickMarker,
  onPickKm,
  lowDetail = false,
}: TerrainSceneProps & { terrain: TerrainGrid }) {
  const model = useMemo(
    () => buildModel(route, terrain, lowDetail, hazards),
    [route, terrain, lowDetail, hazards]
  );
  useEffect(
    () => () => {
      model.terrainGeo.dispose();
      model.skirtGeo.dispose();
      model.routeGeo?.dispose();
    },
    [model]
  );

  // 換路線時把相機對準路線
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => (s.size.height > 0 ? s.size.width / s.size.height : 1));
  const target = useMemo(
    () => new THREE.Vector3(model.center.x, model.center.y * 0.5, model.center.z),
    [model]
  );
  // 直式畫面（手機）水平視野較窄，相機要依比例拉遠，否則路線兩端會被切掉
  const portrait = aspect < 1;
  useEffect(() => {
    const span = Math.max(model.exX, model.exZ);
    const k = Math.max(0.6, Math.min(2.2, span / 9)) * (portrait ? Math.min(2.2, 0.85 / aspect) : 1);
    camera.position.set(target.x + 3.8 * k, target.y + 3.4 * k, target.z + 5.6 * k);
    camera.lookAt(target);
    // aspect 只在直式／橫式切換時重算，避免拖曳縮放視窗時相機一直被重設
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, model, target, portrait]);

  const shadowExtent = Math.max(model.exX, model.exZ) / 2 + 1;
  const head = positionAtKm(model, positionKm);

  const clickKm = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    onPickKm(nearestKm(model, e.point));
  };

  return (
    <>
      <hemisphereLight args={[0xfff9ee, 0xb9b3a2, 0.75]} />
      <directionalLight
        position={[-9, 13, 7]}
        intensity={2.2}
        color={0xfff4e0}
        castShadow
        shadow-mapSize={lowDetail ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.08}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />

      <mesh geometry={model.terrainGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} flatShading />
      </mesh>
      <mesh geometry={model.skirtGeo} receiveShadow>
        <meshStandardMaterial color={CUT_COLOR} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* 頂面略低於壓平後的地面，避免 z-fighting */}
      <mesh position={[0, -0.082, 0]} receiveShadow>
        <boxGeometry args={[model.exX + 0.5, 0.14, model.exZ + 0.5]} />
        <meshStandardMaterial color={PLINTH_COLOR} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.153, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.16} />
      </mesh>

      {model.routeGeo && (
        <mesh geometry={model.routeGeo} castShadow onClick={clickKm}>
          <meshStandardMaterial vertexColors roughness={0.55} />
        </mesh>
      )}

      {markers.map((m) => (
        <CameraPin
          key={m.id}
          marker={m}
          position={positionAtKm(model, m.km)}
          active={m.id === activeMarkerId}
          onPick={onPickMarker}
        />
      ))}

      <mesh position={[head.x, head.y + 0.04, head.z]} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <Line points={[[head.x, head.y, head.z], [head.x, 0, head.z]]} color={INK} lineWidth={1} transparent opacity={0.45} />

      <OrbitControls
        makeDefault
        target={target}
        enableDamping
        maxPolarAngle={Math.PI * 0.48}
        minDistance={1.5}
        maxDistance={Math.max(26, Math.max(model.exX, model.exZ) * 2)}
      />
    </>
  );
}

function CameraPin({
  marker,
  position,
  active,
  onPick,
}: {
  marker: CctvMarker;
  position: THREE.Vector3;
  active: boolean;
  onPick: (m: CctvMarker) => void;
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const color = active ? ROUTE_COLOR.ok : INK;
  return (
    <group position={position} scale={active ? 1.35 : 1}>
      <mesh position={[0, 0.21, 0]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.42, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.11, 0.075, 0.075]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* 比標記大的透明點擊範圍 */}
      <mesh
        position={[0, 0.4, 0]}
        onClick={(e) => {
          if (e.delta > CLICK_TOLERANCE_PX) return;
          e.stopPropagation();
          onPick(marker);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
