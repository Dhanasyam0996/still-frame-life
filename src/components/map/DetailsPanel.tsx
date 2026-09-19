import { Link } from "@tanstack/react-router";
import { ChevronRight, Layers3, Ruler } from "lucide-react";

import { IdChip, StatusBadge, UlpinBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { m2, m3, boxDimsLabel, latLngLabel } from "@/lib/format";
import { useCadastre } from "@/store/useCadastre";
import type { VolumeToggles } from "@/store/useCadastre";

const VOLUME_TOGGLES: { key: keyof VolumeToggles; label: string }[] = [
  { key: "showVolume", label: "Ownership volume" },
  { key: "showBoundary", label: "Boundary edges" },
  { key: "showMeasure", label: "Dimensions" },
  { key: "showElevation", label: "Elevation line" },
  { key: "showCoordinates", label: "Corner coordinates" },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-foreground">{value}</span>
    </div>
  );
}

export function DetailsPanel() {
  const data = useCadastre((s) => s.data);
  const selection = useCadastre((s) => s.selection);
  const select = useCadastre((s) => s.select);
  const volume = useCadastre((s) => s.volume);
  const setVolume = useCadastre((s) => s.setVolume);
  const conflicts = useCadastre((s) => s.conflicts);
  const setConflictView = useCadastre((s) => s.setConflictView);
  const issueUlpin = useCadastre((s) => s.issueUlpin);

  const parcel = data.parcels.find((p) => p.id === selection.parcelId);
  const building = data.buildings.find((b) => b.id === selection.buildingId);
  const floor = data.floors.find((f) => f.id === selection.floorId);
  const property = data.properties.find((p) => p.id === selection.propertyId);
  const utility = data.utilities.find((u) => u.id === selection.utilityId);
  const ulpin = property ? data.ulpins.find((u) => u.propertyId === property.id) : undefined;

  const related = conflicts.filter((c) =>
    c.entityIds.some((id) =>
      [selection.propertyId, selection.buildingId, selection.parcelId, selection.utilityId].includes(
        id,
      ),
    ),
  );

  if (!parcel && !utility) {
    return (
      <div className="panel w-[320px] p-4">
        <p className="text-xs text-muted-foreground">
          Select a parcel, building, floor, apartment or utility in the map to inspect it.
        </p>
      </div>
    );
  }

  return (
    <div className="panel flex max-h-[calc(100vh-13rem)] w-[320px] flex-col overflow-y-auto">
      {/* breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 text-[11px]">
        {parcel ? (
          <button className="font-mono text-primary" onClick={() => select({ parcelId: parcel.id })}>
            {parcel.id}
          </button>
        ) : null}
        {building ? (
          <>
            <ChevronRight className="size-3 text-muted-foreground" />
            <button
              className="font-mono text-primary"
              onClick={() => select({ buildingId: building.id })}
            >
              {building.id}
            </button>
          </>
        ) : null}
        {floor ? (
          <>
            <ChevronRight className="size-3 text-muted-foreground" />
            <button className="font-mono text-primary" onClick={() => select({ floorId: floor.id })}>
              {floor.label}
            </button>
          </>
        ) : null}
        {property ? (
          <>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="font-mono text-foreground">{property.id}</span>
          </>
        ) : null}
      </div>

      <div className="space-y-4 p-3">
        {utility ? (
          <section>
            <h3 className="mb-1 text-sm font-semibold">{utility.name}</h3>
            <Row label="ID" value={utility.id} />
            <Row label="Type" value={utility.type} />
            <Row label="Depth" value={`${utility.depthM.toFixed(2)} m`} />
            <Row label="Diameter" value={`${(utility.radiusM * 2).toFixed(2)} m`} />
            <Row label="Length" value={`${utility.lengthM.toFixed(1)} m`} />
            <Row label="Status" value={utility.status} />
            {utility.connectedPropertyIds.length ? (
              <Row label="Connects" value={utility.connectedPropertyIds.join(", ")} />
            ) : null}
          </section>
        ) : null}

        {property ? (
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Apartment {property.id}</h3>
              <StatusBadge status={property.status} />
            </div>
            <Row label="Type" value={property.propertyType} />
            <Row label="Floor area" value={m2(property.areaM2)} />
            <Row label="Ceiling height" value={`${property.heightM.toFixed(1)} m`} />
            <Row label="Ownership volume" value={m3(property.volumeM3)} />
            <Row label="Bounding box" value={boxDimsLabel(property.box)} />
            <Row label="Base elevation" value={`${property.box.min[2].toFixed(2)} m`} />

            <div className="mt-3 rounded-sm border border-border p-2">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Layers3 className="size-3.5" /> Volume inspector
              </div>
              {VOLUME_TOGGLES.map((t) => (
                <div key={t.key} className="flex items-center justify-between py-0.5">
                  <Label htmlFor={t.key} className="text-xs font-normal text-muted-foreground">
                    {t.label}
                  </Label>
                  <Switch
                    id={t.key}
                    checked={volume[t.key]}
                    onCheckedChange={(v) => setVolume(t.key, v)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3">
              {ulpin ? (
                <div className="rounded-sm border border-primary/40 bg-primary/5 p-2">
                  <p className="font-mono text-xs text-primary">{ulpin.value}</p>
                  <UlpinBadge className="mt-1.5" />
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => issueUlpin(property.id)}
                >
                  Generate prototype ULPIN
                </Button>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link to="/app/properties/$id" params={{ id: property.id }}>
                  Full record
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link
                  to="/app/reports/print/$type/$id"
                  params={{ type: "property", id: property.id }}
                >
                  Report
                </Link>
              </Button>
            </div>
          </section>
        ) : floor ? (
          <section>
            <h3 className="mb-1 text-sm font-semibold">{floor.label}</h3>
            <Row label="ID" value={floor.id} />
            <Row label="Elevation" value={`${floor.elevationM.toFixed(2)} m`} />
            <Row label="Height" value={`${floor.heightM.toFixed(2)} m`} />
            <Row label="Area" value={m2(floor.areaM2)} />
            <Row
              label="Units"
              value={data.properties.filter((p) => p.floorId === floor.id).length}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {data.properties
                .filter((p) => p.floorId === floor.id)
                .map((p) => (
                  <IdChip key={p.id} value={p.id} onClick={() => select({ propertyId: p.id })} />
                ))}
            </div>
          </section>
        ) : building ? (
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Building {building.id}</h3>
              <StatusBadge status={building.status} />
            </div>
            <Row label="Occupancy" value={building.occupancy} />
            <Row label="Floors above ground" value={building.floorsAboveGround} />
            <Row label="Basement levels" value={building.basementLevels} />
            <Row label="Total height" value={`${building.totalHeightM.toFixed(1)} m`} />
            <Row label="Footprint" value={m2(building.footprintAreaM2)} />
            <Row
              label="Units"
              value={data.properties.filter((p) => p.buildingId === building.id).length}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {data.floors
                .filter((f) => f.buildingId === building.id)
                .map((f) => (
                  <IdChip key={f.id} value={f.label} onClick={() => select({ floorId: f.id })} />
                ))}
            </div>
            <Button asChild size="sm" variant="outline" className="mt-3 w-full">
              <Link to="/app/buildings/$id" params={{ id: building.id }}>
                Full record
              </Link>
            </Button>
          </section>
        ) : parcel ? (
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Parcel {parcel.id}</h3>
              <StatusBadge status={parcel.status} />
            </div>
            <Row label="Survey no." value={parcel.surveyNo} />
            <Row label="Area" value={m2(parcel.areaM2)} />
            <Row label="Land type" value={parcel.landType} />
            <Row label="Location" value={parcel.location} />
            <Row label="Anchor" value={latLngLabel(parcel.origin)} />
            <div className="mt-2 flex flex-wrap gap-1">
              {parcel.buildingIds.map((id) => (
                <IdChip key={id} value={id} onClick={() => select({ buildingId: id })} />
              ))}
            </div>
            <Button asChild size="sm" variant="outline" className="mt-3 w-full">
              <Link to="/app/parcels/$id" params={{ id: parcel.id }}>
                Full record
              </Link>
            </Button>
          </section>
        ) : null}

        {related.length ? (
          <section className="border-t border-border pt-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Ruler className="size-3.5" /> Detected conflicts ({related.length})
            </div>
            <div className="space-y-1.5">
              {related.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConflictView(c.id)}
                  className="w-full rounded-sm border border-error/40 bg-error/5 p-2 text-left text-[11px] text-foreground transition-colors hover:border-error"
                >
                  <span className="font-mono text-error">{c.id}</span> — {c.kind}
                  <div className="mt-0.5 text-muted-foreground">{c.note}</div>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
