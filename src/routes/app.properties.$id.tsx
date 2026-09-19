import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import {
  EmptyState,
  PageHeader,
  StatusBadge,
  UlpinBadge,
  ViewInMapLink,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { boxDimsLabel, m2, m3, vec } from "@/lib/format";
import { runValidation } from "@/lib/engine/validation";
import { useAuth } from "@/store/useAuth";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/properties/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Property ${params.id} — 3D-CADASTRE AI` },
      {
        name: "description",
        content: `3D ownership record for ${params.id}: bounding volume, elevation, prototype identifier and detected conflicts.`,
      },
      { property: "og:title", content: `Property ${params.id} — 3D-CADASTRE AI` },
      {
        property: "og:description",
        content: `The full 3D ownership volume record for property ${params.id}.`,
      },
    ],
  }),
  component: PropertyDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <EmptyState
        title="Property not found"
        description="No property with that identifier exists in the demo dataset."
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

function PropertyDetail() {
  const { id } = Route.useParams();
  const data = useCadastre((s) => s.data);
  const conflicts = useCadastre((s) => s.conflicts);
  const issueUlpin = useCadastre((s) => s.issueUlpin);
  const canMutate = useAuth((s) => s.canMutate)();

  const property = data.properties.find((p) => p.id === id);
  if (!property) throw notFound();

  const floor = data.floors.find((f) => f.id === property.floorId);
  const ulpin = data.ulpins.find((u) => u.propertyId === property.id);
  const related = conflicts.filter((c) => c.entityIds.includes(property.id));
  const utilities = data.utilities.filter((u) => u.connectedPropertyIds.includes(property.id));
  const checks = runValidation(data, { scope: "building", id: property.buildingId }).filter((c) =>
    c.evidenceIds.includes(property.id),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title={`Property ${property.id}`}
        description={`${property.propertyType} · ${floor?.label ?? ""} · building ${property.buildingId}`}
        actions={
          <>
            <StatusBadge status={property.status} />
            <Button asChild size="sm" variant="outline">
              <Link
                to="/app/reports/print/$type/$id"
                params={{ type: "property", id: property.id }}
              >
                Generate report
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Ownership volume</h2>
          <Row label="Floor area" value={m2(property.areaM2)} />
          <Row label="Ceiling height" value={`${property.heightM.toFixed(2)} m`} />
          <Row label="Volume" value={m3(property.volumeM3)} />
          <Row label="Bounding box" value={boxDimsLabel(property.box)} />
          <Row label="Min corner" value={vec(property.box.min)} />
          <Row label="Max corner" value={vec(property.box.max)} />
          <Row label="Base elevation" value={`${property.box.min[2].toFixed(2)} m`} />
          <div className="mt-3">
            <ViewInMapLink id={property.id}>Inspect volume in 3D map →</ViewInMapLink>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Identification</h2>
          {ulpin ? (
            <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
              <p className="font-mono text-sm text-primary">{ulpin.value}</p>
              <UlpinBadge className="mt-2" />
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {Object.entries(ulpin.parts).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="capitalize">{k}</dt>
                    <dd className="font-mono text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Spatial reference: <span className="font-mono">{ulpin.spatialRef}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">
                No prototype identifier has been generated for this property yet.
              </p>
              <Button
                size="sm"
                className="mt-3"
                disabled={!canMutate}
                onClick={() => issueUlpin(property.id)}
              >
                Generate prototype ULPIN
              </Button>
              {!canMutate ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Your role is read-only. Sign in as surveyor or administrator to generate
                  identifiers.
                </p>
              ) : null}
            </div>
          )}

          {utilities.length ? (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold">Connected utilities</h2>
              {utilities.map((u) => (
                <Row key={u.id} label={u.name} value={`${u.type} · ${u.depthM.toFixed(2)} m`} />
              ))}
            </>
          ) : null}
        </section>
      </div>

      {related.length ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-error">
            Detected conflicts ({related.length})
          </h2>
          <div className="space-y-1.5">
            {related.map((c) => (
              <div key={c.id} className="rounded-sm border border-error/40 bg-error/5 p-3 text-xs">
                <span className="font-mono text-error">{c.id}</span> — {c.kind}
                <p className="mt-1 text-muted-foreground">{c.note}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  at {vec(c.location)} · severity {c.severity}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {checks.length ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Validation evidence</h2>
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
      ) : null}
    </div>
  );
}
