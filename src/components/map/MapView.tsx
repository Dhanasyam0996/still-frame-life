import { Canvas } from "@react-three/fiber";
import { Box, Layers, Maximize2, MoveDiagonal, Ruler, Rows3 } from "lucide-react";
import { Suspense } from "react";

import { DemoTag } from "@/components/common";
import { DetailsPanel } from "@/components/map/DetailsPanel";
import { Scene } from "@/components/map/Scene";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { m2 } from "@/lib/format";
import { useCadastre, type Layers as LayerState } from "@/store/useCadastre";

const LAYER_ITEMS: { key: keyof LayerState; label: string }[] = [
  { key: "parcels", label: "Parcels" },
  { key: "buildings", label: "Buildings" },
  { key: "properties", label: "Property volumes" },
  { key: "utilities", label: "Underground utilities" },
  { key: "roads", label: "Roads" },
  { key: "terrain", label: "Terrain" },
  { key: "pointCloud", label: "Point cloud (simulated)" },
];

const UTILITY_LEGEND: [string, string][] = [
  ["Water", "#38bdf8"],
  ["Drainage", "#2dd4bf"],
  ["Sewer", "#a16207"],
  ["Electricity", "#facc15"],
  ["Telecom", "#a78bfa"],
  ["Gas", "#fb923c"],
];

function LegacyRecordCard() {
  const data = useCadastre((s) => s.data);
  const parcelId = useCadastre((s) => s.selection.parcelId) ?? "P-102";
  const parcel = data.parcels.find((p) => p.id === parcelId);
  if (!parcel) return null;
  const units = data.properties.filter((p) => p.parcelId === parcel.id).length;

  return (
    <div className="glass absolute left-1/2 top-24 w-[340px] -translate-x-1/2 p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Legacy 2D record
      </p>
      <h3 className="mt-1 font-mono text-sm text-foreground">
        Survey No. {parcel.surveyNo}
      </h3>
      <dl className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Area</dt>
          <dd className="font-mono">{m2(parcel.areaM2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Land type</dt>
          <dd className="font-mono">{parcel.landType}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="font-mono">{parcel.ownerId}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Vertical extent</dt>
          <dd className="font-mono text-warning">not recorded</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Units inside</dt>
          <dd className="font-mono text-warning">not recorded ({units} in 3D)</dd>
        </div>
      </dl>
      <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
        A 2D record describes the ground footprint only. Everything built above or below it —
        floors, apartments, parking, utilities — is invisible to it.
      </p>
    </div>
  );
}

export function MapView() {
  const layers = useCadastre((s) => s.layers);
  const setLayer = useCadastre((s) => s.setLayer);
  const underground = useCadastre((s) => s.undergroundMode);
  const setUnderground = useCadastre((s) => s.setUnderground);
  const explode = useCadastre((s) => s.explodeFloors);
  const setExplode = useCadastre((s) => s.setExplode);
  const cameraMode = useCadastre((s) => s.cameraMode);
  const setCameraMode = useCadastre((s) => s.setCameraMode);
  const recordView = useCadastre((s) => s.recordView);
  const setRecordView = useCadastre((s) => s.setRecordView);
  const measureMode = useCadastre((s) => s.measureMode);
  const setMeasureMode = useCadastre((s) => s.setMeasureMode);
  const conflictView = useCadastre((s) => s.conflictView);
  const setConflictView = useCadastre((s) => s.setConflictView);
  const requestFlyTo = useCadastre((s) => s.requestFlyTo);
  const clearSelection = useCadastre((s) => s.clearSelection);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Record view toggle */}
      <div className="glass absolute left-4 top-4 flex items-center gap-1 p-1">
        <button
          onClick={() => setRecordView("legacy2d")}
          className={`rounded-sm px-3 py-1.5 text-xs transition-colors ${
            recordView === "legacy2d"
              ? "bg-surface-raised text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Legacy 2D Record
        </button>
        <button
          onClick={() => setRecordView("cadastre3d")}
          className={`rounded-sm px-3 py-1.5 text-xs transition-colors ${
            recordView === "cadastre3d"
              ? "bg-surface-raised text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          3D Cadastre
        </button>
      </div>

      <DemoTag className="absolute right-4 top-4" />

      {recordView === "legacy2d" ? <LegacyRecordCard /> : null}

      {/* Layer panel */}
      <div className="glass absolute left-4 top-[4.5rem] w-[228px] p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Layers className="size-3.5" /> Layers
        </div>
        {LAYER_ITEMS.map((l) => (
          <div key={l.key} className="flex items-center justify-between py-0.5">
            <Label htmlFor={`layer-${l.key}`} className="text-xs font-normal text-muted-foreground">
              {l.label}
            </Label>
            <Switch
              id={`layer-${l.key}`}
              checked={layers[l.key]}
              onCheckedChange={(v) => setLayer(l.key, v)}
            />
          </div>
        ))}
        {layers.utilities ? (
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Utility legend
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {UTILITY_LEGEND.map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* View controls */}
      <div className="glass absolute bottom-4 left-4 flex flex-wrap items-center gap-1 p-1">
        <Button
          size="sm"
          variant={cameraMode === "3d" ? "secondary" : "ghost"}
          onClick={() => setCameraMode("3d")}
        >
          <Box className="size-3.5" /> 3D
        </Button>
        <Button
          size="sm"
          variant={cameraMode === "2d" ? "secondary" : "ghost"}
          onClick={() => setCameraMode("2d")}
        >
          <MoveDiagonal className="size-3.5" /> Top-down
        </Button>
        <Button
          size="sm"
          variant={underground ? "secondary" : "ghost"}
          onClick={() => setUnderground(!underground)}
        >
          Underground
        </Button>
        <Button
          size="sm"
          variant={explode ? "secondary" : "ghost"}
          onClick={() => setExplode(!explode)}
        >
          <Rows3 className="size-3.5" /> Explode floors
        </Button>
        <Button
          size="sm"
          variant={measureMode ? "secondary" : "ghost"}
          onClick={() => setMeasureMode(!measureMode)}
        >
          <Ruler className="size-3.5" /> Measure
        </Button>
        <Button size="sm" variant="ghost" onClick={() => requestFlyTo()}>
          <Maximize2 className="size-3.5" /> Recenter
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearSelection();
            setConflictView(null);
          }}
        >
          Reset view
        </Button>
      </div>

      {conflictView ? (
        <div className="glass absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 text-xs">
          Conflict focus active —{" "}
          <button className="text-primary underline" onClick={() => setConflictView(null)}>
            exit
          </button>
        </div>
      ) : null}

      {measureMode ? (
        <div className="glass absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-2 text-[11px] text-muted-foreground">
          Click two points in the scene to measure a straight-line distance.
        </div>
      ) : null}

      <div className="absolute right-4 top-16">
        <DetailsPanel />
      </div>
    </div>
  );
}
