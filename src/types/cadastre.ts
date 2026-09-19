// Domain types for the 3D cadastre prototype.
// Coordinate frame: X east, Y north, Z up, meters (local metric frame).

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export interface Box3D {
  min: Vec3;
  max: Vec3;
}

export type ValidationStatus = "VALID" | "WARNING" | "ERROR";
export type EntityStatus = "Validated" | "Pending" | "Conflict";

export interface Parcel {
  id: string;
  surveyNo: string;
  areaM2: number;
  location: string;
  landType: "Residential" | "Commercial" | "Mixed-use" | "Park/Vacant" | "Industrial";
  status: EntityStatus;
  /** SW corner of the parcel in city coordinates */
  origin: Vec2;
  /** City-coordinate polygon (closed implicitly) */
  polygon: Vec2[];
  elevationM: number;
  buildingIds: string[];
  ownerId: string;
}

export interface Building {
  id: string;
  parcelId: string;
  /** City-coordinate footprint polygon */
  footprint: Vec2[];
  floorsAboveGround: number;
  basementLevels: number;
  floorHeightM: number;
  totalHeightM: number;
  footprintAreaM2: number;
  occupancy: string;
  status: EntityStatus;
}

export interface Floor {
  id: string;
  buildingId: string;
  /** 0 = GROUND, negative = basement */
  level: number;
  label: string;
  elevationM: number;
  heightM: number;
  areaM2: number;
}

export interface Property {
  id: string;
  ownerId: string;
  parcelId: string;
  buildingId: string;
  floorId: string;
  level: number;
  propertyType: "Residential" | "Commercial" | "Parking" | "Office";
  areaM2: number;
  heightM: number;
  volumeM3: number;
  /** City coordinates */
  box: Box3D;
  ulpinId?: string;
  status: EntityStatus;
}

export interface UlpinParts {
  state: string;
  district: string;
  parcel: string;
  building: string;
  floor: string;
  unit: string;
  suffix: string;
}

export interface Ulpin {
  id: string;
  propertyId: string;
  value: string;
  parts: UlpinParts;
  spatialRef: string;
  generatedAt: string;
  status: "Active";
}

export type UtilityType =
  | "Water"
  | "Drainage"
  | "Sewer"
  | "Electricity"
  | "Telecom"
  | "Gas";

export interface Utility {
  id: string;
  name: string;
  type: UtilityType;
  /** City coordinates polyline */
  path: Vec3[];
  radiusM: number;
  depthM: number;
  lengthM: number;
  status: "Active" | "Inactive" | "Planned";
  connectedPropertyIds: string[];
}

export type ConflictStatus = "Open" | "Requires Review" | "Resolved" | "Dismissed";

export interface Conflict {
  id: string;
  kind:
    | "Utility intersects property"
    | "Building outside parcel"
    | "Property overlap"
    | "Clearance warning";
  severity: "high" | "medium" | "low";
  entityIds: string[];
  location: Vec3;
  status: ConflictStatus;
  detectedAt: string;
  note: string;
}

export interface ValidationResult {
  id: string;
  check: string;
  scope: string;
  status: ValidationStatus;
  message: string;
  evidenceIds: string[];
}

export interface DataSource {
  id: string;
  name: string;
  format: string;
  purpose: string;
  dataType: string;
  status: "Loaded" | "Pending" | "Simulated";
}

export interface User {
  id: string;
  role: "admin" | "surveyor" | "viewer";
  displayName: string;
}

export interface Road {
  id: string;
  path: Vec2[];
  widthM: number;
}

export interface CadastreDataset {
  parcels: Parcel[];
  buildings: Building[];
  floors: Floor[];
  properties: Property[];
  utilities: Utility[];
  roads: Road[];
  ulpins: Ulpin[];
}
