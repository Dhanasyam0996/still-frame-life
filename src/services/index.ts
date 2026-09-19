/**
 * Service layer. Every screen talks to these functions, never to the seed data
 * directly, so a real FastAPI + PostGIS backend can be dropped in later without
 * touching the UI. VITE_API_BASE_URL is read here; when unset (the demo case)
 * the mock implementations run against the in-memory dataset.
 */
import { useCadastre } from "@/store/useCadastre";
import { runValidation, type ValidationScope } from "@/lib/engine/validation";
import type {
  Building,
  Conflict,
  DataSource,
  Floor,
  Parcel,
  Property,
  Ulpin,
  Utility,
  ValidationResult,
} from "@/types/cadastre";

export const API_BASE_URL: string | undefined = import.meta.env["VITE_API_BASE_URL"];
export const USING_MOCKS = !API_BASE_URL;

const LATENCY_MS = 180;

async function mock<T>(value: () => T, latency = LATENCY_MS): Promise<T> {
  await new Promise((r) => setTimeout(r, latency));
  if (useCadastre.getState().settings.simulateApiFailure) {
    throw new Error("Simulated API failure (enabled in Settings).");
  }
  return value();
}

const state = () => useCadastre.getState();

export const parcelService = {
  list: () => mock<Parcel[]>(() => state().data.parcels),
  get: (id: string) => mock<Parcel | undefined>(() => state().data.parcels.find((p) => p.id === id)),
};

export const buildingService = {
  list: () => mock<Building[]>(() => state().data.buildings),
  get: (id: string) => mock(() => state().data.buildings.find((b) => b.id === id)),
  floors: (buildingId: string) =>
    mock<Floor[]>(() => state().data.floors.filter((f) => f.buildingId === buildingId)),
};

export const propertyService = {
  list: () => mock<Property[]>(() => state().data.properties),
  get: (id: string) => mock(() => state().data.properties.find((p) => p.id === id)),
};

export const ulpinService = {
  list: () => mock<Ulpin[]>(() => state().data.ulpins),
  generate: (propertyId: string) => mock(() => state().issueUlpin(propertyId), 420),
};

export const utilityService = {
  list: () => mock<Utility[]>(() => state().data.utilities),
};

export const conflictService = {
  list: () =>
    mock<Conflict[]>(() => {
      const { conflicts, conflictStatus } = state();
      return conflicts.map((c) => (conflictStatus[c.id] ? { ...c, status: conflictStatus[c.id]! } : c));
    }),
};

export const validationService = {
  run: (scope: ValidationScope) =>
    mock<ValidationResult[]>(() => runValidation(state().data, scope), 320),
};

export const aiService = {
  mode: "SIMULATION" as const,
};

export const dataSourceService = {
  list: (): Promise<DataSource[]> =>
    mock<DataSource[]>(() => [
      {
        id: "DS-01",
        name: "Drone Imagery",
        dataType: "Raster imagery",
        format: "GeoTIFF / JPG",
        purpose: "Building footprint extraction",
        status: "Simulated",
      },
      {
        id: "DS-02",
        name: "LiDAR / Point Clouds",
        dataType: "Point cloud",
        format: "LAS / LAZ",
        purpose: "Building heights and roof structure",
        status: "Simulated",
      },
      {
        id: "DS-03",
        name: "GIS Parcel Layer",
        dataType: "Vector polygons",
        format: "GeoJSON",
        purpose: "Parcel boundaries and survey numbers",
        status: "Loaded",
      },
      {
        id: "DS-04",
        name: "Building Floor Plans",
        dataType: "Vector / BIM",
        format: "DXF / IFC",
        purpose: "Floor and unit subdivision",
        status: "Pending",
      },
      {
        id: "DS-05",
        name: "GNSS / CORS Coordinates",
        dataType: "Control points",
        format: "RINEX / CSV",
        purpose: "Georeferencing the local metric frame",
        status: "Simulated",
      },
      {
        id: "DS-06",
        name: "Digital Elevation Model (DEM)",
        dataType: "Raster",
        format: "GeoTIFF",
        purpose: "Ground elevation baseline",
        status: "Simulated",
      },
      {
        id: "DS-07",
        name: "Digital Surface Model (DSM)",
        dataType: "Raster",
        format: "GeoTIFF",
        purpose: "Surface heights for extraction",
        status: "Simulated",
      },
    ]),
};
