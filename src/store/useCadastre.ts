import { create } from "zustand";

import { buildDataset } from "@/data/seed";
import { detectConflicts } from "@/lib/engine/conflicts";
import {
  DuplicateUlpinError,
  generateUlpin,
  inputFromProperty,
} from "@/lib/ulpin";
import type {
  CadastreDataset,
  Conflict,
  ConflictStatus,
  Ulpin,
} from "@/types/cadastre";

export interface Selection {
  parcelId?: string;
  buildingId?: string;
  floorId?: string;
  propertyId?: string;
  utilityId?: string;
  conflictId?: string;
}

export interface Layers {
  parcels: boolean;
  buildings: boolean;
  properties: boolean;
  utilities: boolean;
  roads: boolean;
  terrain: boolean;
  pointCloud: boolean;
}

export type RecordView = "legacy2d" | "cadastre3d";
export type CameraMode = "3d" | "2d";

export interface VolumeToggles {
  showVolume: boolean;
  showBoundary: boolean;
  showCoordinates: boolean;
  showElevation: boolean;
  showMeasure: boolean;
}

export interface Settings {
  units: "m" | "ft";
  coordinateDisplay: "local" | "latlng";
  reduceMotion: boolean;
  simulateApiFailure: boolean;
}

interface CadastreState {
  data: CadastreDataset;
  conflicts: Conflict[];
  conflictStatus: Record<string, ConflictStatus>;
  selection: Selection;
  layers: Layers;
  undergroundMode: boolean;
  explodeFloors: boolean;
  cameraMode: CameraMode;
  recordView: RecordView;
  volume: VolumeToggles;
  conflictView: string | null;
  measureMode: boolean;
  settings: Settings;
  flyToken: number;

  select: (next: Selection) => void;
  clearSelection: () => void;
  setLayer: (key: keyof Layers, value: boolean) => void;
  setUnderground: (value: boolean) => void;
  setExplode: (value: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  setRecordView: (v: RecordView) => void;
  setVolume: (key: keyof VolumeToggles, value: boolean) => void;
  setConflictView: (id: string | null) => void;
  setMeasureMode: (v: boolean) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setConflictStatus: (id: string, status: ConflictStatus) => void;
  issueUlpin: (propertyId: string) => { ulpin: Ulpin; existed: boolean };
  resetDemoData: () => void;
  requestFlyTo: () => void;
}

function initialData() {
  const data = buildDataset();
  return { data, conflicts: detectConflicts(data) };
}

export const useCadastre = create<CadastreState>((set, get) => ({
  ...initialData(),
  conflictStatus: {},
  selection: {},
  layers: {
    parcels: true,
    buildings: true,
    properties: true,
    utilities: false,
    roads: true,
    terrain: true,
    pointCloud: false,
  },
  undergroundMode: false,
  explodeFloors: false,
  cameraMode: "3d",
  recordView: "cadastre3d",
  volume: {
    showVolume: true,
    showBoundary: true,
    showCoordinates: false,
    showElevation: false,
    showMeasure: false,
  },
  conflictView: null,
  measureMode: false,
  settings: {
    units: "m",
    coordinateDisplay: "local",
    reduceMotion: false,
    simulateApiFailure: false,
  },
  flyToken: 0,

  select: (next) => {
    const { data } = get();
    const sel: Selection = { ...next };
    // selecting a child auto-selects its parents
    if (sel.propertyId) {
      const prop = data.properties.find((p) => p.id === sel.propertyId);
      if (prop) {
        sel.floorId = prop.floorId;
        sel.buildingId = prop.buildingId;
        sel.parcelId = prop.parcelId;
      }
    } else if (sel.floorId) {
      const floor = data.floors.find((f) => f.id === sel.floorId);
      const building = data.buildings.find((b) => b.id === floor?.buildingId);
      if (building) {
        sel.buildingId = building.id;
        sel.parcelId = building.parcelId;
      }
    } else if (sel.buildingId) {
      const building = data.buildings.find((b) => b.id === sel.buildingId);
      if (building) sel.parcelId = building.parcelId;
    }
    set({ selection: sel, flyToken: get().flyToken + 1 });
  },
  clearSelection: () => set({ selection: {}, conflictView: null }),
  setLayer: (key, value) =>
    set((s) => ({
      layers: { ...s.layers, [key]: value },
      undergroundMode: key === "utilities" && !value ? false : s.undergroundMode,
    })),
  setUnderground: (value) =>
    set((s) => ({
      undergroundMode: value,
      layers: { ...s.layers, utilities: value ? true : s.layers.utilities },
    })),
  setExplode: (value) => set({ explodeFloors: value }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setRecordView: (v) => set({ recordView: v }),
  setVolume: (key, value) => set((s) => ({ volume: { ...s.volume, [key]: value } })),
  setConflictView: (id) => set({ conflictView: id, flyToken: get().flyToken + 1 }),
  setMeasureMode: (v) => set({ measureMode: v }),
  setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
  setConflictStatus: (id, status) =>
    set((s) => ({ conflictStatus: { ...s.conflictStatus, [id]: status } })),

  issueUlpin: (propertyId) => {
    const { data } = get();
    const property = data.properties.find((p) => p.id === propertyId);
    if (!property) throw new Error(`Unknown property ${propertyId}`);
    const result = generateUlpin(
      inputFromProperty(property),
      propertyId,
      data.ulpins,
    );
    if (!result.existed) {
      set({
        data: {
          ...data,
          ulpins: [...data.ulpins, result.ulpin],
          properties: data.properties.map((p) =>
            p.id === propertyId ? { ...p, ulpinId: result.ulpin.value } : p,
          ),
        },
      });
    }
    return result;
  },

  resetDemoData: () => {
    const fresh = initialData();
    set({
      ...fresh,
      conflictStatus: {},
      selection: {},
      conflictView: null,
      undergroundMode: false,
      explodeFloors: false,
      recordView: "cadastre3d",
      cameraMode: "3d",
    });
  },
  requestFlyTo: () => set((s) => ({ flyToken: s.flyToken + 1 })),
}));

export { DuplicateUlpinError };

/** Conflicts with session-level status overrides applied. */
export function useConflicts(): Conflict[] {
  const conflicts = useCadastre((s) => s.conflicts);
  const overrides = useCadastre((s) => s.conflictStatus);
  return conflicts.map((c) => (overrides[c.id] ? { ...c, status: overrides[c.id]! } : c));
}
