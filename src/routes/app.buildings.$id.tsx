import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { EmptyState, IdChip, PageHeader, StatusBadge, ViewInMapLink } from "@/components/common";
import { Button } from "@/components/ui/button";
import { m2, m3 } from "@/lib/format";
import { runValidation } from "@/lib/engine/validation";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/buildings/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Building ${params.id} — 3D-CADASTRE AI` },
      {
        name: "description",
        content: `3D record for building ${params.id}: floor stack, apartments, ownership volume and validation.`,
      },
      { property: "og:title", content: `Building ${params.id} — 3D-CADASTRE AI` },
      { property: "og:description", content: `Floor-by-floor 3D record for building ${params.id}.` },
    ],
  }),
  component: BuildingDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <EmptyState
        title="Building not found"
        description="No building with that identifier exists in the demo dataset."
      />
    </div>
  ),
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-foreground">{value}</span>
    </div>
  );
}

function BuildingDetail() {
  const { id } = Route.useParams();
  const data = useCadastre((s) => s.data);
  const building = data.buildings.find((b) => b.id === id);
  if (!building) throw notFound();

  const floors = [...data.floors.filter((f) => f.buildingId === building.id)].sort(
    (a, b) => b.level - a.level,
  );
  const properties = data.properties.filter((p) => p.buildingId === building.id);
  const checks = runValidation(data, { kind: "building", id: building.id });

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title={`Building ${building.id}`}
        description={`${building.occupancy} · on parcel ${building.parcelId}`}
        actions={
          <>
            <StatusBadge status={building.status} />
            <Button asChild size="sm" variant="outline">
              <Link
                to="/app/reports/print/$type/$id"
                params={{ type: "building", id: building.id }}
              >
                Generate report
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Structure</h2>
          <Row label="Parcel" value={<Link to="/app/parcels/$id" params={{ id: building.parcelId }} className="text-primary">{building.parcelId}</Link>} />
          <Row label="Floors above ground" value={building.floorsAboveGround} />
          <Row label="Basement levels" value={building.basementLevels} />
          <Row label="Floor height" value={`${building.floorHeightM.toFixed(2)} m`} />
          <Row label="Total height" value={`${building.totalHeightM.toFixed(2)} m`} />
          <Row label="Footprint area" value={m2(building.footprintAreaM2)} />
          <Row label="Properties" value={properties.length} />
          <Row
            label="Owned volume"
            value={m3(properties.reduce((s, p) => s + p.volumeM3, 0))}
          />
          <div className="mt-3">
            <ViewInMapLink id={building.id}>View building in 3D map →</ViewInMapLink>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Floor stack</h2>
          <div className="space-y-1">
            {floors.map((f) => {
              const units = data.properties.filter((p) => p.floorId === f.id);
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-sm border border-border px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-mono text-foreground">{f.label}</span>
                    <span className="ml-2 text-muted-foreground">
                      {f.elevationM.toFixed(2)} m · {m2(f.areaM2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {units.map((u) => (
                      <Link key={u.id} to="/app/properties/$id" params={{ id: u.id }}>
                        <IdChip value={u.id} />
                      </Link>
                    ))}
                    {units.length === 0 ? (
                      <span className="text-muted-foreground">common area</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">Validation ({checks.length} checks)</h2>
        <div className="space-y-1.5">
          {checks.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs"
            >
              <StatusBadge status={c.status} />
              <span className="font-medium text-foreground">{c.check}</span>
              <span className="text-muted-foreground">{c.message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
