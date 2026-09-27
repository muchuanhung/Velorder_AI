"use client";

/// <reference types="@react-three/fiber" />

import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";

const Mesh = "mesh" as any;
const MeshStandardMaterial = "meshStandardMaterial" as any;
const SphereGeometry = "sphereGeometry" as any;
const PlaneGeometry = "planeGeometry" as any;
const Color = "color" as any;
const AmbientLight = "ambientLight" as any;
const DirectionalLight = "directionalLight" as any;
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Route } from "@/lib/routes/route-data";

const COLORS = { safe: "#315f4b", caution: "#b97828", risky: "#a44235" };

type Point = { x: number; y: number; z: number; km: number; rain: number };

function TerrainPath({ route, playhead }: { route: Route; playhead: number }) {
  const marker = useRef<THREE.Mesh>(null);
  const points = useMemo<Point[]>(() => {
    const profile = route.elevationProfile?.length ? route.elevationProfile : [[0, 0], [route.distance, 20]];
    const max = Math.max(...profile.map(([, elevation]) => elevation ?? 0), 1);
    return profile.map(([km, elevation], index) => {
      const t = index / Math.max(profile.length - 1, 1);
      const segment = route.segments[Math.min(Math.floor(t * route.segments.length), Math.max(route.segments.length - 1, 0))];
      return { x: (t - 0.5) * 11, y: ((elevation ?? 0) / max) * 2.9 + 0.25, z: Math.sin(t * Math.PI * 2.3) * 1.3 + Math.cos(t * Math.PI * 4) * 0.35, km: km ?? 0, rain: segment?.rainProbability ?? 10 };
    });
  }, [route]);

  const lines = useMemo(() => points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]!;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(point.x, point.y, point.z), new THREE.Vector3(next.x, next.y, next.z)]);
    return { curve, color: point.rain >= 60 ? COLORS.risky : point.rain >= 40 ? COLORS.caution : COLORS.safe };
  }), [points]);

  useFrame(() => {
    const point = points[Math.min(Math.round(playhead * (points.length - 1)), points.length - 1)];
    if (marker.current && point) marker.current.position.set(point.x, point.y + 0.22, point.z);
  });

  return <>
    {lines.map((line, index) => <Mesh key={index} geometry={new THREE.TubeGeometry(line.curve, 8, 0.09, 8, false)}><MeshStandardMaterial color={line.color} roughness={0.92} /></Mesh>)}
    <Mesh ref={marker}><SphereGeometry args={[0.16, 16, 16]} /><MeshStandardMaterial color="#d5a33d" emissive="#b97828" emissiveIntensity={0.18} roughness={0.7} /></Mesh>
  </>;
}

function Ground() {
  return <Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}><PlaneGeometry args={[22, 9]} /><MeshStandardMaterial color="#d9ddcc" roughness={1} /></Mesh>;
}

export function DaylightTerrain({ route, playhead = 0.34 }: { route: Route; playhead?: number }) {
  return <div className="daylight-terrain" aria-label="路線日光地形 3D 預覽">
    <Canvas camera={{ position: [0, 5.5, 10], fov: 33 }} dpr={[1, 1.5]} shadows>
      <Color attach="background" args={["#dfe3d3"]} />
      <AmbientLight intensity={1.7} />
      <DirectionalLight position={[2, 8, 4]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <Ground />
      <TerrainPath route={route} playhead={playhead} />
      <OrbitControls enablePan={false} minDistance={6} maxDistance={16} minPolarAngle={0.55} maxPolarAngle={1.35} />
    </Canvas>
    <div className="terrain-caption"><span>深度 = 海拔</span><span>天氣 = 路段顏色</span><span>建築物不在範圍</span></div>
  </div>;
}

export function TerrainLegend() {
  return <div className="terrain-legend" aria-label="路段顏色圖例"><span><i className="legend-dot safe" />安全</span><span><i className="legend-dot caution" />注意</span><span><i className="legend-dot risky" />危險</span></div>;
}

export function TerrainScrubber({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input aria-label="路線播放位置" className="terrain-scrubber" type="range" min="0" max="1" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}
