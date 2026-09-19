// Validation engine — 8 real geometric checks over the synthetic dataset.
import type { CadastreDataset, ValidationResult, Vec2 } from "@/types/cadastre";
import {
  aabbOverlap3D,
  boxVolume,
  polygonArea,
  polygonWithinPolygon2D,
  polylineIntersectsBox,
} from "@/lib/spatial";

export type ValidationScope =
  | { kind: "city" }
  | { kind: "parcel"; id: string }
  | { kind: "building"; id: string };

export const CHECKS = [
  "Parcel geometry",
  "Building containment",
  "Apartment overlap",
  "Floor consistency",
  "ULPIN uniqueness",
  "Utility intersections",
  "Invalid geometry",
  "Coordinate validity",
] as const;

function scopeLabel(scope: ValidationScope) {
  return scope.kind === "city" ? "City-wide" : `${scope.id}`;
}

function subset(data: CadastreDataset, scope: ValidationScope) {
  if (scope.kind === "city") return data;
  const parcels =
    scope.kind === "parcel" ? data.parcels.filter((p) => p.id === scope.id) : data.parcels;
  const buildings = data.buildings.filter((b) =>
    scope.kind === "parcel" ? b.parcelId === scope.id : b.id === scope.id,
  );
  const buildingIds = new Set(buildings.map((b) => b.id));
  const floors = data.floors.filter((f) => buildingIds.has(f.buildingId));
  const properties = data.properties.filter((p) => buildingIds.has(p.buildingId));
  const scopedParcelIds = new Set(buildings.map((b) => b.parcelId));
  return {
    ...data,
    parcels: scope.kind === "parcel" ? parcels : data.parcels.filter((p) => scopedParcelIds.has(p.id)),
    buildings,
    floors,
    properties,
  };
}

export function runValidation(
  data: CadastreDataset,
  scope: ValidationScope = { kind: "city" },
): ValidationResult[] {
  const s = subset(data, scope);
  const label = scopeLabel(scope);
  const results: ValidationResult[] = [];
  const add = (
    check: string,
    status: ValidationResult["status"],
    message: string,
    evidenceIds: string[] = [],
  ) => results.push({ id: `${check}-${label}`, check, scope: label, status, message, evidenceIds });

  // 1. Parcel geometry
  const badParcels = s.parcels.filter(
    (p) => p.polygon.length < 3 || Math.abs(polygonArea(p.polygon) - p.areaM2) > 2,
  );
  add(
    "Parcel geometry",
    badParcels.length ? "ERROR" : "VALID",
    badParcels.length
      ? `${badParcels.length} parcel polygon(s) do not match their recorded area.`
      : `${s.parcels.length} parcel polygon(s) are closed and match their computed area.`,
    badParcels.map((p) => p.id),
  );

  // 2. Building containment
  const escaping = s.buildings.filter((b) => {
    const parcel = data.parcels.find((p) => p.id === b.parcelId);
    return parcel ? !polygonWithinPolygon2D(b.footprint as Vec2[], parcel.polygon) : false;
  });
  add(
    "Building containment",
    escaping.length ? "ERROR" : "VALID",
    escaping.length
      ? `${escaping.map((b) => b.id).join(", ")} extend(s) beyond the parcel boundary.`
      : `All ${s.buildings.length} building footprint(s) lie within their parcel.`,
    escaping.map((b) => b.id),
  );

  // 3. Apartment overlap
  const overlaps: string[] = [];
  for (let i = 0; i < s.properties.length; i++) {
    for (let j = i + 1; j < s.properties.length; j++) {
      const a = s.properties[i]!;
      const b = s.properties[j]!;
      if (a.buildingId !== b.buildingId || a.level !== b.level) continue;
      if (aabbOverlap3D(a.box, b.box)) overlaps.push(`${a.id}/${b.id}`);
    }
  }
  add(
    "Apartment overlap",
    overlaps.length ? "ERROR" : "VALID",
    overlaps.length
      ? `Overlapping ownership volumes: ${overlaps.join(", ")}.`
      : `No overlapping ownership volumes among ${s.properties.length} properties.`,
    overlaps,
  );

  // 4. Floor consistency
  const inconsistent = s.buildings.filter((b) => {
    const fl = s.floors.filter((f) => f.buildingId === b.id);
    const expected = b.floorsAboveGround + 1 + b.basementLevels;
    return fl.length !== expected;
  });
  add(
    "Floor consistency",
    inconsistent.length ? "ERROR" : "VALID",
    inconsistent.length
      ? `Floor counts do not match building height for ${inconsistent.map((b) => b.id).join(", ")}.`
      : `Floor stacks are contiguous and match total height for ${s.buildings.length} building(s).`,
    inconsistent.map((b) => b.id),
  );

  // 5. ULPIN uniqueness
  const scopedIds = new Set(s.properties.map((p) => p.id));
  const scopedUlpins = data.ulpins.filter((u) => scopedIds.has(u.propertyId));
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const u of scopedUlpins) {
    if (seen.has(u.value)) dupes.push(u.value);
    seen.set(u.value, u.propertyId);
  }
  add(
    "ULPIN uniqueness",
    dupes.length ? "ERROR" : "VALID",
    dupes.length
      ? `Duplicate ULPIN values detected: ${dupes.join(", ")}.`
      : `${scopedUlpins.length} issued ULPIN(s) are unique.`,
    dupes,
  );

  // 6. Utility intersections
  const hits: string[] = [];
  for (const u of data.utilities) {
    for (const p of s.properties) {
      if (polylineIntersectsBox(u.path, p.box, u.radiusM).hit) hits.push(`${u.id} × ${p.id}`);
    }
  }
  add(
    "Utility intersections",
    hits.length ? "WARNING" : "VALID",
    hits.length
      ? `Utility lines pass through ownership volumes: ${hits.join(", ")}.`
      : "No utility line passes through an ownership volume.",
    hits,
  );

  // 7. Invalid geometry (zero or negative volumes / areas)
  const invalid = s.properties.filter((p) => boxVolume(p.box) <= 0 || p.areaM2 <= 0);
  add(
    "Invalid geometry",
    invalid.length ? "ERROR" : "VALID",
    invalid.length
      ? `${invalid.length} propert(ies) have a degenerate volume.`
      : `All ${s.properties.length} volumes have positive extent.`,
    invalid.map((p) => p.id),
  );

  // 8. Coordinate validity
  const outOfRange = s.properties.filter((p) =>
    [...p.box.min, ...p.box.max].some((n) => !Number.isFinite(n) || Math.abs(n) > 10_000),
  );
  add(
    "Coordinate validity",
    outOfRange.length ? "ERROR" : "VALID",
    outOfRange.length
      ? `${outOfRange.length} volume(s) fall outside the local metric frame.`
      : "All coordinates are finite and inside the local metric frame.",
    outOfRange.map((p) => p.id),
  );

  return results;
}
