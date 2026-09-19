// Conflict engine — derives conflicts from real geometry. Never hardcoded.
import type { CadastreDataset, Conflict, Vec2, Vec3 } from "@/types/cadastre";
import {
  aabbOverlap3D,
  boxCenter,
  minDistancePolylineBox,
  polygonWithinPolygon2D,
  polylineIntersectsBox,
} from "@/lib/spatial";

const DETECTED_AT = "2026-01-12T09:00:00.000Z";

export function detectConflicts(data: CadastreDataset): Conflict[] {
  const conflicts: Conflict[] = [];

  // 1. Utilities intersecting property volumes
  for (const utility of data.utilities) {
    for (const property of data.properties) {
      const r = polylineIntersectsBox(utility.path, property.box, utility.radiusM);
      if (r.hit) {
        conflicts.push({
          id: `CF-${utility.id}-${property.id}`,
          kind: "Utility intersects property",
          severity: "high",
          entityIds: [utility.id, property.id],
          location: (r.entry ?? boxCenter(property.box)) as Vec3,
          status: "Requires Review",
          detectedAt: DETECTED_AT,
          note: `${utility.type} line ${utility.id} passes through the ownership volume of ${property.id}.`,
        });
      }
    }
  }

  // 2. Buildings not contained by their parcel
  for (const building of data.buildings) {
    const parcel = data.parcels.find((p) => p.id === building.parcelId);
    if (!parcel) continue;
    const inner = building.footprint as Vec2[];
    if (!polygonWithinPolygon2D(inner, parcel.polygon)) {
      const cx = inner.reduce((s, v) => s + v[0], 0) / inner.length;
      const cy = inner.reduce((s, v) => s + v[1], 0) / inner.length;
      conflicts.push({
        id: `CF-${building.id}-${parcel.id}`,
        kind: "Building outside parcel",
        severity: "high",
        entityIds: [building.id, parcel.id],
        location: [cx, cy, building.totalHeightM / 2],
        status: "Open",
        detectedAt: DETECTED_AT,
        note: `Footprint of ${building.id} extends beyond the boundary of parcel ${parcel.id}.`,
      });
    }
  }

  // 3. Overlapping property volumes
  for (let i = 0; i < data.properties.length; i++) {
    for (let j = i + 1; j < data.properties.length; j++) {
      const a = data.properties[i]!;
      const b = data.properties[j]!;
      if (a.buildingId !== b.buildingId || a.level !== b.level) continue;
      if (aabbOverlap3D(a.box, b.box)) {
        conflicts.push({
          id: `CF-${a.id}-${b.id}`,
          kind: "Property overlap",
          severity: "high",
          entityIds: [a.id, b.id],
          location: boxCenter(a.box),
          status: "Open",
          detectedAt: DETECTED_AT,
          note: `Ownership volumes of ${a.id} and ${b.id} overlap.`,
        });
      }
    }
  }

  // 4. Clearance warnings (< 0.5 m between a utility and a volume)
  for (const utility of data.utilities) {
    for (const property of data.properties) {
      if (conflicts.some((c) => c.entityIds.includes(utility.id) && c.entityIds.includes(property.id)))
        continue;
      const d = minDistancePolylineBox(utility.path, property.box);
      if (d > 0 && d < 0.5) {
        conflicts.push({
          id: `CF-CLR-${utility.id}-${property.id}`,
          kind: "Clearance warning",
          severity: "low",
          entityIds: [utility.id, property.id],
          location: boxCenter(property.box),
          status: "Open",
          detectedAt: DETECTED_AT,
          note: `${utility.id} runs ${d.toFixed(2)} m from ${property.id} — below the 0.5 m clearance guideline.`,
        });
      }
    }
  }

  return conflicts;
}
