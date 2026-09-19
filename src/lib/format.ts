import type { Box3D, Vec2, Vec3 } from "@/types/cadastre";
import { toSyntheticLatLng } from "@/data/seed";

export function m2(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²`;
}

export function m3(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} m³`;
}

export function m(n: number, units: "m" | "ft" = "m"): string {
  if (units === "ft") return `${(n * 3.28084).toFixed(2)} ft`;
  return `${n.toFixed(2)} m`;
}

export function vec(v: Vec3 | Vec2): string {
  return `(${v.map((n) => n.toFixed(2)).join(", ")})`;
}

export function boxSize(box: Box3D): Vec3 {
  return [
    box.max[0] - box.min[0],
    box.max[1] - box.min[1],
    box.max[2] - box.min[2],
  ];
}

export function boxDimsLabel(box: Box3D): string {
  const [w, d, h] = boxSize(box);
  const vol = w * d * h;
  return `${w.toFixed(1)} m × ${d.toFixed(1)} m × ${h.toFixed(1)} m = ${vol.toFixed(0)} m³`;
}

export function latLngLabel(p: Vec2): string {
  const { lat, lng } = toSyntheticLatLng(p);
  return `${lat.toFixed(6)}, ${lng.toFixed(6)} (synthetic anchor)`;
}

export function toLocal(v: Vec2 | Vec3, origin: Vec2): number[] {
  return v.map((n, i) => (i < 2 ? n - origin[i]! : n));
}
