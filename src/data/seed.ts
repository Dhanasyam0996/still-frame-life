// Deterministic synthetic dataset. No real-world data is used anywhere.
import type {
  Building,
  CadastreDataset,
  Floor,
  Parcel,
  Property,
  Road,
  Utility,
  Vec2,
  Vec3,
} from "@/types/cadastre";
import {
  buildUlpinParts,
  formatUlpin,
  inputFromProperty,
} from "@/lib/ulpin";
import { polygonArea, polylineLength } from "@/lib/spatial";

export const PARCEL_SIZE = 50;
export const PARCEL_PITCH = 62;
export const GRID_COLS = 4;
export const SYNTHETIC_ANCHOR = { lat: 16.7107, lng: 81.0952, label: "synthetic anchor" };

/** Deterministic seeded RNG (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parcelOrigin(index: number): Vec2 {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return [col * PARCEL_PITCH, row * PARCEL_PITCH];
}

/** Display-only lat/lng from the synthetic anchor. */
export function toSyntheticLatLng([x, y]: Vec2) {
  return {
    lat: SYNTHETIC_ANCHOR.lat + y / 111_320,
    lng: SYNTHETIC_ANCHOR.lng + x / (111_320 * Math.cos((SYNTHETIC_ANCHOR.lat * Math.PI) / 180)),
  };
}

function rect(ox: number, oy: number, w: number, h: number): Vec2[] {
  return [
    [ox, oy],
    [ox + w, oy],
    [ox + w, oy + h],
    [ox, oy + h],
  ];
}

const LAND_TYPES: Parcel["landType"][] = [
  "Residential",
  "Residential",
  "Residential",
  "Residential",
  "Commercial",
  "Mixed-use",
  "Park/Vacant",
  "Residential",
  "Commercial",
  "Mixed-use",
  "Residential",
  "Park/Vacant",
];

const SURVEY_NOS = [
  "458/1",
  "458/2",
  "458/3",
  "212/1A",
  "212/2",
  "314/6",
  "314/7B",
  "509/1",
  "509/2",
  "77/4",
  "77/5C",
  "601/3",
];

function ownerId(n: number): string {
  const hex = (0x7f3a21 + n * 0x1d3f7).toString(16).toUpperCase().slice(-6);
  return `OWN-${hex}`;
}

function buildParcels(): Parcel[] {
  return Array.from({ length: 12 }, (_, i) => {
    const id = `P-${101 + i}`;
    const [ox, oy] = parcelOrigin(i);
    // Two non-rectangular parcels for realism (clipped corners).
    let polygon: Vec2[] = rect(ox, oy, PARCEL_SIZE, PARCEL_SIZE);
    if (i === 6) {
      polygon = [
        [ox, oy],
        [ox + 50, oy],
        [ox + 50, oy + 32],
        [ox + 30, oy + 50],
        [ox, oy + 50],
      ];
    }
    if (i === 9) {
      polygon = [
        [ox, oy],
        [ox + 50, oy + 6],
        [ox + 50, oy + 50],
        [ox, oy + 44],
      ];
    }
    return {
      id,
      surveyNo: SURVEY_NOS[i]!,
      areaM2: Math.round(polygonArea(polygon)),
      location: `Sector ${Math.floor(i / 4) + 1}, Block ${(i % 4) + 1}, Eluru (synthetic)`,
      landType: LAND_TYPES[i]!,
      status: "Validated",
      origin: [ox, oy],
      polygon,
      elevationM: 12 + (i % 5) * 0.4,
      buildingIds: [],
      ownerId: ownerId(i),
    } satisfies Parcel;
  });
}

interface BuildingSpec {
  id: string;
  parcelIndex: number;
  local: { x0: number; y0: number; x1: number; y1: number };
  floorsAboveGround: number;
  basementLevels: number;
  occupancy: string;
  unitsPerFloor: number;
  hero?: boolean;
}

const BUILDING_SPECS: BuildingSpec[] = [
  // Hero building
  {
    id: "B-001",
    parcelIndex: 1,
    local: { x0: 10, y0: 10, x1: 40, y1: 40 },
    floorsAboveGround: 6,
    basementLevels: 0,
    occupancy: "Residential apartments",
    unitsPerFloor: 6,
    hero: true,
  },
  // Encroaching building: footprint sits 1.4 m too far east
  {
    id: "B-002",
    parcelIndex: 2,
    local: { x0: 11.4, y0: 10, x1: 51.4, y1: 40 },
    floorsAboveGround: 4,
    basementLevels: 0,
    occupancy: "Residential apartments",
    unitsPerFloor: 5,
  },
  {
    id: "B-003",
    parcelIndex: 0,
    local: { x0: 12, y0: 12, x1: 38, y1: 36 },
    floorsAboveGround: 3,
    basementLevels: 0,
    occupancy: "Residential",
    unitsPerFloor: 4,
  },
  // Basement parking building
  {
    id: "B-004",
    parcelIndex: 3,
    local: { x0: 10, y0: 10, x1: 40, y1: 40 },
    floorsAboveGround: 4,
    basementLevels: 1,
    occupancy: "Mixed-use with basement parking",
    unitsPerFloor: 5,
  },
  {
    id: "B-005",
    parcelIndex: 4,
    local: { x0: 8, y0: 10, x1: 42, y1: 34 },
    floorsAboveGround: 8,
    basementLevels: 0,
    occupancy: "Commercial offices",
    unitsPerFloor: 4,
  },
  {
    id: "B-006",
    parcelIndex: 7,
    local: { x0: 14, y0: 14, x1: 36, y1: 38 },
    floorsAboveGround: 5,
    basementLevels: 0,
    occupancy: "Residential",
    unitsPerFloor: 4,
  },
  {
    id: "B-007",
    parcelIndex: 8,
    local: { x0: 10, y0: 12, x1: 40, y1: 36 },
    floorsAboveGround: 2,
    basementLevels: 0,
    occupancy: "Retail",
    unitsPerFloor: 3,
  },
  {
    id: "B-008",
    parcelIndex: 10,
    local: { x0: 12, y0: 10, x1: 38, y1: 40 },
    floorsAboveGround: 6,
    basementLevels: 0,
    occupancy: "Residential",
    unitsPerFloor: 4,
  },
];

const FLOOR_HEIGHT = 3.2;

function floorLabel(level: number): string {
  if (level === 0) return "GROUND";
  if (level < 0) return `BASEMENT ${Math.abs(level)}`;
  return `FLOOR ${level}`;
}

/** Hero layout: 6 units, central corridor y 22.5–27.5 is common area. */
function heroUnitBoxes(ox: number, oy: number): { x0: number; y0: number; x1: number; y1: number }[] {
  const xs = [
    [10, 20],
    [20, 30],
    [30, 40],
  ];
  const rows = [
    [10, 22.5],
    [27.5, 40],
  ];
  const out: { x0: number; y0: number; x1: number; y1: number }[] = [];
  for (const [y0, y1] of rows) {
    for (const [x0, x1] of xs) {
      out.push({ x0: ox + x0!, y0: oy + y0!, x1: ox + x1!, y1: oy + y1! });
    }
  }
  return out;
}

/** Generic layout: N columns across x, 5 m rear corridor. */
function genericUnitBoxes(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  count: number,
): { x0: number; y0: number; x1: number; y1: number }[] {
  const w = (x1 - x0) / count;
  const depth = y1 - y0 - 5;
  return Array.from({ length: count }, (_, i) => ({
    x0: x0 + i * w,
    y0: y0,
    x1: x0 + (i + 1) * w,
    y1: y0 + depth,
  }));
}

export function buildDataset(): CadastreDataset {
  const parcels = buildParcels();
  const buildings: Building[] = [];
  const floors: Floor[] = [];
  const properties: Property[] = [];
  const rand = rng(20260919);

  for (const spec of BUILDING_SPECS) {
    const parcel = parcels[spec.parcelIndex]!;
    const [ox, oy] = parcel.origin;
    const fx0 = ox + spec.local.x0;
    const fy0 = oy + spec.local.y0;
    const fx1 = ox + spec.local.x1;
    const fy1 = oy + spec.local.y1;
    const footprint = rect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    const footprintAreaM2 = polygonArea(footprint);
    const totalHeightM = (spec.floorsAboveGround + 1) * FLOOR_HEIGHT;

    const building: Building = {
      id: spec.id,
      parcelId: parcel.id,
      footprint,
      floorsAboveGround: spec.floorsAboveGround,
      basementLevels: spec.basementLevels,
      floorHeightM: FLOOR_HEIGHT,
      totalHeightM,
      footprintAreaM2: Math.round(footprintAreaM2),
      occupancy: spec.occupancy,
      status: "Validated",
    };
    buildings.push(building);
    parcel.buildingIds.push(building.id);

    const levels: number[] = [];
    for (let b = spec.basementLevels; b >= 1; b--) levels.push(-b);
    for (let l = 0; l <= spec.floorsAboveGround; l++) levels.push(l);

    for (const level of levels) {
      const floorId = `${spec.id}-F${level}`;
      floors.push({
        id: floorId,
        buildingId: spec.id,
        level,
        label: floorLabel(level),
        elevationM: level * FLOOR_HEIGHT,
        heightM: FLOOR_HEIGHT,
        areaM2: Math.round(footprintAreaM2),
      });

      if (level === 0) continue; // ground = lobby/parking, no properties

      if (level < 0) {
        // Basement parking property (hero basement case: B-004 / PK-B01)
        const box = {
          min: [ox + 10, oy + 10, level * FLOOR_HEIGHT] as Vec3,
          max: [ox + 40, oy + 22, (level + 1) * FLOOR_HEIGHT] as Vec3,
        };
        properties.push({
          id: `PK-B0${Math.abs(level)}`,
          ownerId: ownerId(40 + Math.abs(level)),
          parcelId: parcel.id,
          buildingId: spec.id,
          floorId,
          level,
          propertyType: "Parking",
          areaM2: (box.max[0] - box.min[0]) * (box.max[1] - box.min[1]),
          heightM: FLOOR_HEIGHT,
          volumeM3:
            (box.max[0] - box.min[0]) * (box.max[1] - box.min[1]) * FLOOR_HEIGHT,
          box,
          status: "Validated",
        });
        continue;
      }

      const unitBoxes = spec.hero
        ? heroUnitBoxes(ox, oy)
        : genericUnitBoxes(fx0, fy0, fx1, fy1, spec.unitsPerFloor);

      unitBoxes.forEach((u, i) => {
        const z0 = level * FLOOR_HEIGHT;
        const z1 = z0 + FLOOR_HEIGHT;
        const box = {
          min: [u.x0, u.y0, z0] as Vec3,
          max: [u.x1, u.y1, z1] as Vec3,
        };
        const areaM2 = (u.x1 - u.x0) * (u.y1 - u.y0);
        const idNum = `${level}${String(i + 1).padStart(2, "0")}`;
        const prefix = spec.id === "B-001" ? "A" : `${spec.id.slice(-1)}A`;
        properties.push({
          id: `${prefix}-${idNum}`,
          ownerId: ownerId(Math.floor(rand() * 900) + i + level),
          parcelId: parcel.id,
          buildingId: spec.id,
          floorId,
          level,
          propertyType:
            parcel.landType === "Commercial"
              ? "Office"
              : parcel.landType === "Mixed-use" && level <= 1
                ? "Commercial"
                : "Residential",
          areaM2: Number(areaM2.toFixed(2)),
          heightM: FLOOR_HEIGHT,
          volumeM3: Number((areaM2 * FLOOR_HEIGHT).toFixed(2)),
          box,
          status: "Validated",
        });
      });
    }
  }

  const roads = buildRoads();
  const utilities = buildUtilities(parcels);

  // Pre-register every ULPIN except the hero property, so the live demo
  // generates A-402 on stage.
  const ulpins = properties
    .filter((p) => p.id !== "A-402")
    .map((p) => {
      const input = inputFromProperty(p);
      const parts = buildUlpinParts(input);
      const value = formatUlpin(parts);
      p.ulpinId = value;
      return {
        id: `ULP-${value}`,
        propertyId: p.id,
        value,
        parts,
        spatialRef: input.spatialRef,
        generatedAt: "2026-01-12T09:00:00.000Z",
        status: "Active" as const,
      };
    });

  return { parcels, buildings, floors, properties, utilities, roads, ulpins };
}

function buildRoads(): Road[] {
  const roads: Road[] = [];
  const maxX = GRID_COLS * PARCEL_PITCH;
  const maxY = 3 * PARCEL_PITCH;
  for (let c = 0; c <= GRID_COLS; c++) {
    const x = c * PARCEL_PITCH - 6;
    roads.push({ id: `RD-V${c}`, path: [[x, -6], [x, maxY]], widthM: 12 });
  }
  for (let r = 0; r <= 3; r++) {
    const y = r * PARCEL_PITCH - 6;
    roads.push({ id: `RD-H${r}`, path: [[-6, y], [maxX, y]], widthM: 12 });
  }
  return roads;
}

const UTILITY_DEPTH: Record<string, number> = {
  Water: -2.5,
  Drainage: -1.5,
  Sewer: -3.0,
  Electricity: -0.9,
  Telecom: -0.6,
  Gas: -1.2,
};

function buildUtilities(parcels: Parcel[]): Utility[] {
  const utilities: Utility[] = [];
  const p102 = parcels[1]!;
  const [ox, oy] = p102.origin;

  // Hero utility: UT-W-001. Road main -> riser through the common corridor ->
  // legacy branch that runs INSIDE apartment A-402.
  const heroPath: Vec3[] = [
    [ox - 6, oy + 25, -2.5],
    [ox + 25, oy + 25, -2.5],
    [ox + 25, oy + 25, 14.4],
    [ox + 25, oy + 16, 14.4],
  ];
  utilities.push({
    id: "UT-W-001",
    name: "Water Pipeline (Block B riser)",
    type: "Water",
    path: heroPath,
    radiusM: 0.15,
    depthM: -2.5,
    lengthM: Number(polylineLength(heroPath).toFixed(2)),
    status: "Active",
    connectedPropertyIds: [],
  });

  // Sewer running through the basement parking property PK-B01 (B-004 / P-104)
  const p104 = parcels[3]!;
  const sewerPath: Vec3[] = [
    [p104.origin[0] - 6, p104.origin[1] + 16, -1.8],
    [p104.origin[0] + 44, p104.origin[1] + 16, -1.8],
  ];
  utilities.push({
    id: "UT-S-004",
    name: "Sewer Line (basement crossing)",
    type: "Sewer",
    path: sewerPath,
    radiusM: 0.2,
    depthM: -1.8,
    lengthM: Number(polylineLength(sewerPath).toFixed(2)),
    status: "Active",
    connectedPropertyIds: [],
  });

  // Road-following network
  const netSpecs: { id: string; type: keyof typeof UTILITY_DEPTH; path: Vec2[] }[] = [
    { id: "UT-D-001", type: "Drainage", path: [[-6, 56], [248, 56]] },
    { id: "UT-D-002", type: "Drainage", path: [[118, -6], [118, 180]] },
    { id: "UT-S-001", type: "Sewer", path: [[-6, -6], [248, -6]] },
    { id: "UT-S-002", type: "Sewer", path: [[56, -6], [56, 180]] },
    { id: "UT-S-003", type: "Sewer", path: [[-6, 118], [248, 118]] },
    { id: "UT-E-001", type: "Electricity", path: [[-6, 56], [-6, 180]] },
    { id: "UT-E-002", type: "Electricity", path: [[180, -6], [180, 180]] },
    { id: "UT-E-003", type: "Electricity", path: [[-6, 118], [180, 118]] },
    { id: "UT-T-001", type: "Telecom", path: [[56, -6], [248, -6]] },
    { id: "UT-T-002", type: "Telecom", path: [[242, -6], [242, 180]] },
    { id: "UT-G-001", type: "Gas", path: [[-6, 180], [248, 180]] },
    { id: "UT-W-002", type: "Water", path: [[-6, -6], [-6, 180]] },
  ];

  for (const s of netSpecs) {
    const depth = UTILITY_DEPTH[s.type]!;
    const path: Vec3[] = s.path.map(([x, y]) => [x, y, depth]);
    utilities.push({
      id: s.id,
      name: `${s.type} main`,
      type: s.type as Utility["type"],
      path,
      radiusM: s.type === "Sewer" ? 0.25 : 0.15,
      depthM: depth,
      lengthM: Number(polylineLength(path).toFixed(2)),
      status: "Active",
      connectedPropertyIds: [],
    });
  }

  return utilities;
}
