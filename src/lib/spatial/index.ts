// Pure spatial engine. All functions operate in the local metric frame
// (X east, Y north, Z up, meters) and are free of any Three.js dependency.

import type { Box3D, Vec2, Vec3 } from "@/types/cadastre";

export const EPS = 1e-6;

/** Three.js is Y-up: convert [x(east), y(north), z(up)] to scene space. */
export function toScene([x, y, z]: Vec3): Vec3 {
  return [x, z, -y];
}

export function boxVolume(b: Box3D): number {
  return (
    Math.max(0, b.max[0] - b.min[0]) *
    Math.max(0, b.max[1] - b.min[1]) *
    Math.max(0, b.max[2] - b.min[2])
  );
}

export function boxPlanArea(b: Box3D): number {
  return Math.max(0, b.max[0] - b.min[0]) * Math.max(0, b.max[1] - b.min[1]);
}

export function boxCenter(b: Box3D): Vec3 {
  return [
    (b.min[0] + b.max[0]) / 2,
    (b.min[1] + b.max[1]) / 2,
    (b.min[2] + b.max[2]) / 2,
  ];
}

/** Touching faces are NOT an overlap (epsilon guarded). */
export function aabbOverlap3D(a: Box3D, b: Box3D, eps = 1e-4): boolean {
  for (let i = 0; i < 3; i++) {
    if (a.min[i] >= b.max[i] - eps) return false;
    if (b.min[i] >= a.max[i] - eps) return false;
  }
  return true;
}

export function pointInPolygon2D(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    const intersect =
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function segmentsIntersect2D(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const cross = (o: Vec2, p: Vec2, q: Vec2) =>
    (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  return (
    ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
    ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))
  );
}

/** All vertices of inner inside outer, and no edge crossings. */
export function polygonWithinPolygon2D(inner: Vec2[], outer: Vec2[]): boolean {
  for (const v of inner) {
    if (!pointInPolygon2D(v, outer)) {
      // allow points lying exactly on the boundary
      if (!pointOnPolygonBoundary(v, outer)) return false;
    }
  }
  for (let i = 0; i < inner.length; i++) {
    const a = inner[i]!;
    const b = inner[(i + 1) % inner.length]!;
    for (let j = 0; j < outer.length; j++) {
      const c = outer[j]!;
      const d = outer[(j + 1) % outer.length]!;
      if (segmentsIntersect2D(a, b, c, d)) return false;
    }
  }
  return true;
}

function pointOnPolygonBoundary(p: Vec2, poly: Vec2[], tol = 1e-6): boolean {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    if (distancePointSegment2D(p, a, b) <= tol) return true;
  }
  return false;
}

export function distancePointSegment2D(p: Vec2, a: Vec2, b: Vec2): number {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const wx = p[0] - a[0];
  const wy = p[1] - a[1];
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const dx = wx - t * vx;
  const dy = wy - t * vy;
  return Math.hypot(dx, dy);
}

/** Shoelace area, always positive. */
export function polygonArea(poly: Vec2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % poly.length]!;
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

export function polylineLength(path: Vec3[]): number {
  let l = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    l += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return l;
}

function expandBox(box: Box3D, r: number): Box3D {
  return {
    min: [box.min[0] - r, box.min[1] - r, box.min[2] - r],
    max: [box.max[0] + r, box.max[1] + r, box.max[2] + r],
  };
}

/**
 * Slab method. The box is expanded by the pipe radius so a tube that grazes
 * the volume counts as a hit. Returns the entry point when hit.
 */
export function segmentIntersectsBox(
  a: Vec3,
  b: Vec3,
  box: Box3D,
  radius = 0,
): { hit: boolean; entry?: Vec3 } {
  const B = expandBox(box, radius);
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  let tmin = 0;
  let tmax = 1;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]!) < EPS) {
      if (a[i]! < B.min[i]! || a[i]! > B.max[i]!) return { hit: false };
    } else {
      let t1 = (B.min[i]! - a[i]!) / d[i]!;
      let t2 = (B.max[i]! - a[i]!) / d[i]!;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return { hit: false };
    }
  }
  return {
    hit: true,
    entry: [a[0] + d[0] * tmin, a[1] + d[1] * tmin, a[2] + d[2] * tmin],
  };
}

export function polylineIntersectsBox(
  path: Vec3[],
  box: Box3D,
  radius = 0,
): { hit: boolean; entry?: Vec3 } {
  for (let i = 1; i < path.length; i++) {
    const r = segmentIntersectsBox(path[i - 1]!, path[i]!, box, radius);
    if (r.hit) return r;
  }
  return { hit: false };
}

/** Approximate minimum distance between a segment and a box (sampled). */
export function minDistanceSegmentBox(a: Vec3, b: Vec3, box: Box3D): number {
  const samples = 48;
  let best = Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p: Vec3 = [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
    const dx = Math.max(box.min[0] - p[0], 0, p[0] - box.max[0]);
    const dy = Math.max(box.min[1] - p[1], 0, p[1] - box.max[1]);
    const dz = Math.max(box.min[2] - p[2], 0, p[2] - box.max[2]);
    best = Math.min(best, Math.hypot(dx, dy, dz));
  }
  return best;
}

export function minDistancePolylineBox(path: Vec3[], box: Box3D): number {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    best = Math.min(best, minDistanceSegmentBox(path[i - 1]!, path[i]!, box));
  }
  return best;
}
