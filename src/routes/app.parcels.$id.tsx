import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import {
  EmptyState,
  IdChip,
  PageHeader,
  StatusBadge,
  ViewInMapLink,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { latLngLabel, m2 } from "@/lib/format";
import { runValidation } from "@/lib/engine/validation";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/parcels/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Parcel ${params.id} — 3D-CADASTRE AI` },
      {
        name: "description",
        content: `Record for land parcel ${params.id}: area, land type, buildings, 3D properties and validation status.`,
      },
      { property: "og:title", content: `Parcel ${params.id} — 3D-CADASTRE AI` },
      {
        property: "og:description",
        content: `Full 3D cadastre record for parcel ${params.id}.`,
      },
    ],
  }),
  component: ParcelDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <EmptyState title="Parcel not found" description="No parcel with that identifier exists in the demo dataset." />
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

function ParcelDetail() {
  const { id } = Route.useParams();
  const data = useCadastre((s) => s.data);
  const parcel = data.parcels.find((p) => p.id === id);
  if (!parcel) throw notFound();

  const buildings = data.buildings.filter((b) => b.parcelId === parcel.id);
  const properties = data.properties.filter((p) => p.parcelId === parcel.id);
  const checks = runValidation(data, { scope: "parcel", id: parcel.id });

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title={`Parcel ${parcel.id}`}
        description={parcel.location}
        actions={
          <>
            <StatusBadge status={parcel.status} />
            <Button asChild size="sm" variant="outline">
              <Link to="/app/reports/print/$type/$id" params={{ type: "parcel", id: parcel.id }}>
                Generate report
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Land record</h2>
          <Row label="Survey number" value={parcel.surveyNo} />
          <Row label="Area" value={m2(parcel.areaM2)} />
          <Row label="Land type" value={parcel.landType} />
          <Row label="Owner reference" value={parcel.ownerId} />
          <Row label="Ground elevation" value={`${parcel.elevationM.toFixed(2)} m`} />
          <Row label="Anchor coordinate" value={latLngLabel(parcel.origin)} />
          <Row label="Boundary vertices" value={parcel.polygon.length} />
          <div className="mt-3">
            <ViewInMapLink id={parcel.id}>View parcel in 3D map →</ViewInMapLink>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">What stands on it</h2>
          <Row label="Buildings" value={buildings.length} />
          <Row label="Floors" value={data.floors.filter((f) => buildings.some((b) => b.id === f.buildingId)).length} />
          <Row label="3D properties" value={properties.length} />
          <Row
            label="Owned volume"
            value={`${properties.reduce((s, p) => s + p.volumeM3, 0).toFixed(0)} m³`}
          />
          <div className="mt-3 flex flex-wrap gap-1">
            {buildings.map((b) => (
              <Link key={b.id} to="/app/buildings/$id" params={{ id: b.id }}>
                <IdChip value={b.id} />
              </Link>
            ))}
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
