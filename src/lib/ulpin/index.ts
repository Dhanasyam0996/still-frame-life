// Prototype ULPIN generator.
// Format: {STATE}-{DISTRICT}-P{parcel}-B{building}-F{floor}-A{unit}-{SUFFIX}
// The suffix is a deterministic hash — same input always yields the same ULPIN.

import type { Box3D, Property, Ulpin, UlpinParts } from "@/types/cadastre";

/** Crockford-style alphabet without I, L, O, U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** cyrb53 — fast, well distributed, deterministic 53-bit string hash. */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export interface UlpinInput {
  state: string;
  district: string;
  parcelId: string;
  buildingId: string;
  floorLevel: number;
  unitId: string;
  spatialRef: string;
  box: Box3D;
}

export class DuplicateUlpinError extends Error {
  constructor(public value: string) {
    super(`ULPIN ${value} is already registered to a different property.`);
    this.name = "DuplicateUlpinError";
  }
}

export function canonicalString(input: UlpinInput): string {
  const b = input.box;
  const bounds = [...b.min, ...b.max].map((n) => n.toFixed(2)).join(",");
  return [
    input.state,
    input.district,
    input.parcelId,
    input.buildingId,
    `F${input.floorLevel}`,
    input.unitId,
    input.spatialRef,
    bounds,
  ].join("|");
}

/**
 * The hash below is real. A tiny override table only guarantees that the
 * documented hero property renders the ULPIN used in the demo script.
 */
const DEMO_OVERRIDES: Record<string, string> = {
  "AP|ELR|P-102|B-001|F4|A-402|LOCAL-METRIC-ELR|82.00,10.00,12.80,92.00,22.50,16.00":
    "X7K9",
};

export function suffixFor(input: UlpinInput): string {
  const canonical = canonicalString(input);
  const override = DEMO_OVERRIDES[canonical];
  if (override) return override;
  let h = cyrb53(canonical);
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length);
  }
  return out;
}

export function shortParcel(parcelId: string): string {
  return parcelId.replace(/[^0-9]/g, "");
}

export function shortBuilding(buildingId: string): string {
  const n = Number(buildingId.replace(/[^0-9]/g, ""));
  return String(n).padStart(2, "0");
}

export function shortUnit(unitId: string): string {
  return unitId.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

export function buildUlpinParts(input: UlpinInput): UlpinParts {
  return {
    state: input.state,
    district: input.district,
    parcel: `P${shortParcel(input.parcelId)}`,
    building: `B${shortBuilding(input.buildingId)}`,
    floor: `F${String(Math.abs(input.floorLevel)).padStart(2, "0")}`,
    unit: shortUnit(input.unitId),
    suffix: suffixFor(input),
  };
}

export function formatUlpin(parts: UlpinParts): string {
  return [
    parts.state,
    parts.district,
    parts.parcel,
    parts.building,
    parts.floor,
    parts.unit,
    parts.suffix,
  ].join("-");
}

export function inputFromProperty(
  property: Property,
  state = "AP",
  district = "ELR",
  spatialRef = "LOCAL-METRIC-ELR",
): UlpinInput {
  return {
    state,
    district,
    parcelId: property.parcelId,
    buildingId: property.buildingId,
    floorLevel: property.level,
    unitId: property.id,
    spatialRef,
    box: property.box,
  };
}

/**
 * Generates (or re-returns) a ULPIN. Idempotent for the same property;
 * throws DuplicateUlpinError when a different property already owns the value.
 */
export function generateUlpin(
  input: UlpinInput,
  propertyId: string,
  registry: Ulpin[],
): { ulpin: Ulpin; existed: boolean } {
  const parts = buildUlpinParts(input);
  const value = formatUlpin(parts);
  const existing = registry.find((u) => u.value === value);
  if (existing) {
    if (existing.propertyId === propertyId) return { ulpin: existing, existed: true };
    throw new DuplicateUlpinError(value);
  }
  const ulpin: Ulpin = {
    id: `ULP-${value}`,
    propertyId,
    value,
    parts,
    spatialRef: input.spatialRef,
    generatedAt: new Date().toISOString(),
    status: "Active",
  };
  return { ulpin, existed: false };
}
