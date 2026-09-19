import { Html, Line, OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { boxCenter, toScene } from "@/lib/spatial";
import { useCadastre } from "@/store/useCadastre";
import type { Box3D, Utility, Vec2, Vec3 } from "@/types/cadastre";

const UTILITY_COLORS: Record<Utility["type"], string> = {
  Water: "#38bdf8",
  Drainage: "#2dd4bf",
  Sewer: "#a16207",
  Electricity: "#facc15",
  Telecom: "#a78bfa",
  Gas: "#fb923c",
};

const WORLD = { minX: -20, maxX: 262, minY: -20, maxY: 194 };
const SOIL_DEPTH = 6;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function shapeFromPolygon(poly: Vec2[]) {
  const shape = new THREE.Shape();
  poly.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return shape;
}

function boxArgs(box: Box3D): { args: [number, number, number]; position: Vec3 } {
  const w = box.max[0] - box.min[0];
  const d = box.max[1] - box.min[1];
  const h = box.max[2] - box.min[2];
  const c = boxCenter(box);
  return { args: [w, h, d], position: toScene(c) };
}

/* ---------------------------------------------------------------- terrain */

function Terrain({ opacity }: { opacity: number }) {
  const w = WORLD.maxX - WORLD.minX;
  const d = WORLD.maxY - WORLD.minY;
  const cx = (WORLD.minX + WORLD.maxX) / 2;
  const cy = (WORLD.minY + WORLD.maxY) / 2;
  const transparent = opacity < 1;
  return (
    <group>
      <mesh position={[cx, -0.02, -cy]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color="#0f1a22"
          roughness={0.95}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[cx, -SOIL_DEPTH / 2 - 0.03, -cy]}>
        <boxGeometry args={[w, SOIL_DEPTH, d]} />
        <meshStandardMaterial
          color="#1a2530"
          roughness={1}
          transparent
          opacity={transparent ? opacity * 0.9 : 0.95}
        />
      </mesh>
      <gridHelper
        args={[Math.max(w, d), Math.round(Math.max(w, d) / 10), "#1d2b38", "#1d2b38"]}
        position={[cx, 0.01, -cy]}
      />
    </group>
  );
}

function Roads({ visible }: { visible: boolean }) {
  const roads = useCadastre((s) => s.data.roads);
  if (!visible) return null;
  return (
    <group>
      {roads.map((r) => {
        const [a, b] = [r.path[0]!, r.path[1]!];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const horizontal = Math.abs(b[1] - a[1]) < 0.001;
        const cx = (a[0] + b[0]) / 2;
        const cy = (a[1] + b[1]) / 2;
        return (
          <group key={r.id}>
            <mesh position={[cx, 0.02, -cy]} rotation={[-Math.PI / 2, 0, horizontal ? 0 : Math.PI / 2]}>
              <planeGeometry args={[len, r.widthM]} />
              <meshStandardMaterial color="#1b2733" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* --------------------------------------------------------------- parcels */

function Parcels({ legacy }: { legacy: boolean }) {
  const parcels = useCadastre((s) => s.data.parcels);
  const selectedId = useCadastre((s) => s.selection.parcelId);
  const select = useCadastre((s) => s.select);

  return (
    <group>
      {parcels.map((p) => {
        const selected = p.id === selectedId;
        const shape = shapeFromPolygon(p.polygon);
        const pts: [number, number, number][] = [...p.polygon, p.polygon[0]!].map(([x, y]) => [
          x,
          0.06,
          -y,
        ]);
        return (
          <group key={p.id}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.04, 0]}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                select({ parcelId: p.id });
              }}
            >
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial
                color="#22d3ee"
                transparent
                opacity={selected ? 0.16 : legacy ? 0.1 : 0.04}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Line
              points={pts}
              color={selected ? "#22d3ee" : "#3b5a73"}
              lineWidth={selected ? 2.5 : 1}
            />
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------- buildings */

function Buildings({ legacy }: { legacy: boolean }) {
  const buildings = useCadastre((s) => s.data.buildings);
  const selectedBuilding = useCadastre((s) => s.selection.buildingId);
  const select = useCadastre((s) => s.select);
  if (legacy) return null;

  return (
    <group>
      {buildings.map((b) => {
        if (b.id === selectedBuilding) return null;
        const xs = b.footprint.map((f) => f[0]);
        const ys = b.footprint.map((f) => f[1]);
        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);
        const y0 = Math.min(...ys);
        const y1 = Math.max(...ys);
        const h = b.totalHeightM;
        const dim = Boolean(selectedBuilding);
        return (
          <mesh
            key={b.id}
            castShadow
            receiveShadow
            position={[(x0 + x1) / 2, h / 2, -(y0 + y1) / 2]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              select({ buildingId: b.id });
            }}
          >
            <boxGeometry args={[x1 - x0, h, y1 - y0]} />
            <meshStandardMaterial
              color="#7c8fa0"
              roughness={0.7}
              metalness={0.1}
              transparent={dim}
              opacity={dim ? 0.25 : 1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Selected building: stacked floor slabs + unit volumes. */
function SelectedBuilding() {
  const data = useCadastre((s) => s.data);
  const selection = useCadastre((s) => s.selection);
  const explode = useCadastre((s) => s.explodeFloors);
  const volume = useCadastre((s) => s.volume);
  const select = useCadastre((s) => s.select);
  const legacy = useCadastre((s) => s.recordView === "legacy2d");

  const building = data.buildings.find((b) => b.id === selection.buildingId);
  if (!building || legacy) return null;

  const xs = building.footprint.map((f) => f[0]);
  const ys = building.footprint.map((f) => f[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const floors = data.floors.filter((f) => f.buildingId === building.id);
  const selectedProperty = data.properties.find((p) => p.id === selection.propertyId);

  return (
    <group>
      {floors.map((f) => {
        const isSelected = f.id === selection.floorId;
        const gap = explode ? f.level * 2.4 : 0;
        const yCenter = f.elevationM + f.heightM / 2 + gap;
        return (
          <mesh
            key={f.id}
            castShadow
            position={[(x0 + x1) / 2, yCenter, -(y0 + y1) / 2]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              select({ floorId: f.id });
            }}
          >
            <boxGeometry args={[x1 - x0, f.heightM * 0.94, y1 - y0]} />
            <meshStandardMaterial
              color={isSelected ? "#9fb3c4" : "#7c8fa0"}
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={selection.floorId ? (isSelected ? 0.9 : 0.18) : 0.75}
            />
          </mesh>
        );
      })}

      {/* Unit volumes on the selected floor */}
      {selection.floorId
        ? data.properties
            .filter((p) => p.floorId === selection.floorId)
            .map((p) => {
              const isSelected = p.id === selection.propertyId;
              const { args, position } = boxArgs(p.box);
              const floor = floors.find((f) => f.id === p.floorId)!;
              const gap = explode ? floor.level * 2.4 : 0;
              const pos: [number, number, number] = [position[0], position[1] + gap, position[2]];
              if (!isSelected) {
                return (
                  <mesh
                    key={p.id}
                    position={pos}
                    onClick={(e: ThreeEvent<MouseEvent>) => {
                      e.stopPropagation();
                      select({ propertyId: p.id });
                    }}
                  >
                    <boxGeometry args={args} />
                    <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} wireframe />
                  </mesh>
                );
              }
              return (
                <group key={p.id}>
                  {volume.showVolume ? (
                    <mesh
                      position={pos}
                      onClick={(e: ThreeEvent<MouseEvent>) => {
                        e.stopPropagation();
                        select({ propertyId: p.id });
                      }}
                    >
                      <boxGeometry args={args} />
                      <meshStandardMaterial
                        color="#22d3ee"
                        emissive="#22d3ee"
                        emissiveIntensity={0.45}
                        transparent
                        opacity={0.28}
                      />
                    </mesh>
                  ) : null}
                  {volume.showBoundary ? (
                    <lineSegments position={pos}>
                      <edgesGeometry args={[new THREE.BoxGeometry(...args)]} />
                      <lineBasicMaterial color="#67e8f9" />
                    </lineSegments>
                  ) : null}
                  {volume.showMeasure ? (
                    <Html position={[pos[0], pos[1] + args[1] / 2 + 2, pos[2]]} center distanceFactor={90}>
                      <div className="whitespace-nowrap rounded-sm border border-primary/50 bg-surface/90 px-2 py-1 font-mono text-[10px] text-primary">
                        {args[0].toFixed(0)} m × {args[2].toFixed(1)} m × {args[1].toFixed(1)} m ={" "}
                        {(args[0] * args[1] * args[2]).toFixed(0)} m³
                      </div>
                    </Html>
                  ) : null}
                  {volume.showElevation ? (
                    <Line
                      points={[
                        [p.box.min[0], 0, -p.box.min[1]],
                        [p.box.min[0], p.box.min[2], -p.box.min[1]],
                      ]}
                      color="#67e8f9"
                      dashed
                      dashSize={0.6}
                      gapSize={0.4}
                      lineWidth={1}
                    />
                  ) : null}
                  {volume.showCoordinates ? (
                    <Html position={[p.box.min[0], p.box.min[2], -p.box.min[1]]} center distanceFactor={90}>
                      <div className="rounded-sm border border-border bg-surface/90 px-1.5 py-0.5 font-mono text-[9px] text-foreground">
                        {p.box.min.map((n) => n.toFixed(1)).join(", ")}
                      </div>
                    </Html>
                  ) : null}
                </group>
              );
            })
        : null}

      {selectedProperty && !selection.floorId ? null : null}
    </group>
  );
}

/* ------------------------------------------------------------- utilities */

function UtilityTubes() {
  const utilities = useCadastre((s) => s.data.utilities);
  const visible = useCadastre((s) => s.layers.utilities);
  const selectedUtility = useCadastre((s) => s.selection.utilityId);
  const select = useCadastre((s) => s.select);

  const geometries = useMemo(
    () =>
      utilities.map((u) => {
        const curve = new THREE.CurvePath<THREE.Vector3>();
        for (let i = 1; i < u.path.length; i++) {
          const a = toScene(u.path[i - 1]!);
          const b = toScene(u.path[i]!);
          curve.add(new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)));
        }
        return {
          utility: u,
          geometry: new THREE.TubeGeometry(curve, Math.max(8, u.path.length * 12), Math.max(u.radiusM, 0.35), 8, false),
        };
      }),
    [utilities],
  );

  useEffect(() => () => geometries.forEach((g) => g.geometry.dispose()), [geometries]);

  if (!visible) return null;

  return (
    <group>
      {geometries.map(({ utility, geometry }) => {
        const color = UTILITY_COLORS[utility.type];
        const active = selectedUtility === utility.id;
        return (
          <mesh
            key={utility.id}
            geometry={geometry}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              select({ utilityId: utility.id });
            }}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={active ? 1.1 : 0.5}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function DepthRuler({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const marks = [0, -1, -2, -3, -4, -5, -6];
  return (
    <group position={[-14, 0, 20]}>
      <Line points={[[0, 0, 0], [0, -6, 0]]} color="#8b9baa" lineWidth={1} />
      {marks.map((m) => (
        <Html key={m} position={[0, m, 0]} center distanceFactor={120}>
          <div className="whitespace-nowrap font-mono text-[9px] text-muted-foreground">
            {m.toFixed(1)} m
          </div>
        </Html>
      ))}
    </group>
  );
}

/* ------------------------------------------------------- conflict marker */

function ConflictMarker() {
  const conflictViewId = useCadastre((s) => s.conflictView);
  const conflicts = useCadastre((s) => s.conflicts);
  const ref = useRef<THREE.Mesh>(null);
  const conflict = conflicts.find((c) => c.id === conflictViewId);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() % 1.2) / 1.2;
    const s = 1 + t * 0.6;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 1 - t;
  });

  if (!conflict) return null;
  const p = toScene(conflict.location);
  return (
    <group position={p}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.9, 48]} />
        <meshBasicMaterial color="#ef4444" transparent side={THREE.DoubleSide} />
      </mesh>
      <Line
        points={[
          [0, 0, 0],
          [6, 6, 6],
        ]}
        color="#ef4444"
        dashed
        dashSize={0.5}
        gapSize={0.4}
        lineWidth={1}
      />
      <Html position={[6, 6.6, 6]} center distanceFactor={110}>
        <div className="whitespace-nowrap rounded-sm border border-error/60 bg-surface/95 px-2 py-1 font-mono text-[10px] text-error">
          {conflict.entityIds.join(" × ")}
        </div>
      </Html>
    </group>
  );
}

/* ------------------------------------------------------------ point cloud */

function PointCloud({ visible }: { visible: boolean }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(3000 * 3);
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 3000; i++) {
      arr[i * 3] = WORLD.minX + rand() * (WORLD.maxX - WORLD.minX);
      arr[i * 3 + 1] = rand() * 28;
      arr[i * 3 + 2] = -(WORLD.minY + rand() * (WORLD.maxY - WORLD.minY));
    }
    return arr;
  }, []);
  if (!visible) return null;
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#38bdf8" transparent opacity={0.35} />
    </points>
  );
}

/* --------------------------------------------------------------- camera */

function CameraRig({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const data = useCadastre((s) => s.data);
  const selection = useCadastre((s) => s.selection);
  const conflictView = useCadastre((s) => s.conflictView);
  const conflicts = useCadastre((s) => s.conflicts);
  const underground = useCadastre((s) => s.undergroundMode);
  const flyToken = useCadastre((s) => s.flyToken);

  const anim = useRef<{
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromT: THREE.Vector3;
    toT: THREE.Vector3;
    start: number;
  } | null>(null);

  useEffect(() => {
    const target = new THREE.Vector3();
    let distance = 90;
    const conflict = conflicts.find((c) => c.id === conflictView);
    if (conflict) {
      target.set(...toScene(conflict.location));
      distance = 34;
    } else if (selection.propertyId) {
      const p = data.properties.find((x) => x.id === selection.propertyId);
      if (p) {
        target.set(...toScene(boxCenter(p.box)));
        distance = 42;
      }
    } else if (selection.utilityId) {
      const u = data.utilities.find((x) => x.id === selection.utilityId);
      if (u) {
        const mid = u.path[Math.floor(u.path.length / 2)]!;
        target.set(...toScene(mid));
        distance = 70;
      }
    } else if (selection.floorId) {
      const f = data.floors.find((x) => x.id === selection.floorId);
      const b = data.buildings.find((x) => x.id === f?.buildingId);
      if (f && b) {
        const xs = b.footprint.map((p) => p[0]);
        const ys = b.footprint.map((p) => p[1]);
        target.set(
          (Math.min(...xs) + Math.max(...xs)) / 2,
          f.elevationM + f.heightM / 2,
          -(Math.min(...ys) + Math.max(...ys)) / 2,
        );
        distance = 60;
      }
    } else if (selection.buildingId) {
      const b = data.buildings.find((x) => x.id === selection.buildingId);
      if (b) {
        const xs = b.footprint.map((p) => p[0]);
        const ys = b.footprint.map((p) => p[1]);
        target.set(
          (Math.min(...xs) + Math.max(...xs)) / 2,
          b.totalHeightM / 2,
          -(Math.min(...ys) + Math.max(...ys)) / 2,
        );
        distance = 80;
      }
    } else if (selection.parcelId) {
      const p = data.parcels.find((x) => x.id === selection.parcelId);
      if (p) {
        target.set(p.origin[0] + 25, 6, -(p.origin[1] + 25));
        distance = 100;
      }
    } else {
      target.set(121, 12, -87);
      distance = 250;
    }

    const dir = new THREE.Vector3(0.75, underground ? 0.42 : 0.62, 0.75).normalize();
    const to = target.clone().add(dir.multiplyScalar(distance));
    anim.current = {
      from: camera.position.clone(),
      to,
      fromT: controlsRef.current?.target?.clone?.() ?? new THREE.Vector3(),
      toT: target,
      start: performance.now(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToken, conflictView, underground]);

  useFrame(() => {
    const a = anim.current;
    if (!a) return;
    const t = Math.min(1, (performance.now() - a.start) / 900);
    const e = easeInOutCubic(t);
    camera.position.lerpVectors(a.from, a.to, e);
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(a.fromT, a.toT, e);
      controlsRef.current.update();
    }
    if (t >= 1) anim.current = null;
  });

  return null;
}

/* -------------------------------------------------------------- measure */

function MeasureTool() {
  const measureMode = useCadastre((s) => s.measureMode);
  const [points, setPoints] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!measureMode) setPoints([]);
  }, [measureMode]);

  if (!measureMode) return null;
  const dist =
    points.length === 2 ? points[0]!.distanceTo(points[1]!) : null;

  return (
    <group>
      <mesh
        position={[120, 0.05, -80]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          setPoints((prev) => (prev.length >= 2 ? [e.point.clone()] : [...prev, e.point.clone()]));
        }}
      >
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      ))}
      {points.length === 2 ? (
        <>
          <Line points={[points[0]!, points[1]!]} color="#22d3ee" lineWidth={2} />
          <Html position={points[0]!.clone().lerp(points[1]!, 0.5)} center distanceFactor={100}>
            <div className="rounded-sm border border-primary/50 bg-surface/95 px-2 py-1 font-mono text-[10px] text-primary">
              {dist!.toFixed(2)} m
            </div>
          </Html>
        </>
      ) : null}
    </group>
  );
}

/* ----------------------------------------------------------------- scene */

export function Scene() {
  const controlsRef = useRef<any>(null);
  const layers = useCadastre((s) => s.layers);
  const underground = useCadastre((s) => s.undergroundMode);
  const cameraMode = useCadastre((s) => s.cameraMode);
  const legacy = useCadastre((s) => s.recordView === "legacy2d");
  const conflictView = useCadastre((s) => s.conflictView);
  const clearSelection = useCadastre((s) => s.clearSelection);

  const [terrainOpacity, setTerrainOpacity] = useState(1);
  const target = underground ? 0.12 : 1;
  useFrame((_, delta) => {
    setTerrainOpacity((o) => {
      const next = o + (target - o) * Math.min(1, delta * 4.5);
      return Math.abs(next - target) < 0.005 ? target : next;
    });
  });

  const dim = conflictView ? 0.25 : 1;

  return (
    <>
      {cameraMode === "3d" ? (
        <PerspectiveCamera makeDefault fov={45} position={[250, 180, 190]} far={2000} />
      ) : (
        <OrthographicCamera makeDefault position={[87, 220, -25]} zoom={3.2} near={-500} far={2000} />
      )}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        makeDefault
      />
      <CameraRig controlsRef={controlsRef} />

      <color attach="background" args={["#0b1117"]} />
      <fog attach="fog" args={["#0b1117", 380, 900]} />
      <hemisphereLight args={["#9cc4e4", "#0b1117", 0.5]} />
      <directionalLight
        position={[60, 120, 40]}
        intensity={1.1 * dim}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight intensity={0.35 * dim} />

      <mesh
        position={[120, -0.5, -80]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => clearSelection()}
        visible={false}
      >
        <planeGeometry args={[600, 600]} />
        <meshBasicMaterial />
      </mesh>

      {layers.terrain ? <Terrain opacity={terrainOpacity} /> : null}
      <Roads visible={layers.roads} />
      {layers.parcels ? <Parcels legacy={legacy} /> : null}
      {layers.buildings ? <Buildings legacy={legacy} /> : null}
      {layers.properties ? <SelectedBuilding /> : null}
      <UtilityTubes />
      <DepthRuler visible={underground} />
      <ConflictMarker />
      <PointCloud visible={layers.pointCloud} />
      <MeasureTool />
    </>
  );
}
