import { Link, createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { DemoTag, EmptyState, StatusBadge, UlpinBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { boxDimsLabel, latLngLabel, m2, m3, vec } from "@/lib/format";
import { runValidation } from "@/lib/engine/validation";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/reports/print/$type/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.type} report ${params.id} — 3D-CADASTRE AI` },
      {
        name: "description",
        content: `Printable ${params.type} report for ${params.id}, generated from the 3D cadastre demonstration dataset.`,
      },
      { property: "og:title", content: `${params.type} report ${params.id} — 3D-CADASTRE AI` },
      {
        property: "og:description",
        content: `Printable 3D cadastre record for ${params.id}. Synthetic demonstration data.`,
      },
    ],
  }),
  component: ReportPrint,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-foreground">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReportPrint() {
  const { type, id } = Route.useParams();
  const data = useCadastre((s) => s.data);
  const conflicts = useCadastre((s) => s.conflicts);

  let body: React.ReactNode = null;
  let heading = "";

  if (type === "property") {
    const p = data.properties.find((x) => x.id === id);
    if (p) {
      const ulpin = data.ulpins.find((u) => u.propertyId === p.id);
      const floor = data.floors.find((f) => f.id === p.floorId);
      const related = conflicts.filter((c) => c.entityIds.includes(p.id));
      heading = `Property record — ${p.id}`;
      body = (
        <>
          <Section title="Identification">
            {ulpin ? (
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <p className="font-mono text-sm text-primary">{ulpin.value}</p>
                  <UlpinBadge className="mt-2" />
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    Spatial ref {ulpin.spatialRef}
                  </p>
                </div>
                <div className="bg-white p-2">
                  <QRCodeSVG value={ulpin.value} size={72} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No prototype identifier has been generated for this property.
              </p>
            )}
          </Section>
          <Section title="Location">
            <Field label="Parcel" value={p.parcelId} />
            <Field label="Building" value={p.buildingId} />
            <Field label="Floor" value={floor?.label ?? p.floorId} />
            <Field label="Type" value={p.propertyType} />
            <Field label="Owner reference" value={p.ownerId} />
          </Section>
          <Section title="3D extent">
            <Field label="Floor area" value={m2(p.areaM2)} />
            <Field label="Ceiling height" value={`${p.heightM.toFixed(2)} m`} />
            <Field label="Ownership volume" value={m3(p.volumeM3)} />
            <Field label="Bounding box" value={boxDimsLabel(p.box)} />
            <Field label="Min corner" value={vec(p.box.min)} />
            <Field label="Max corner" value={vec(p.box.max)} />
          </Section>
          <Section title="Status">
            <div className="flex items-center gap-2">
              <StatusBadge status={p.status} />
              <span className="text-xs text-muted-foreground">
                {related.length
                  ? `${related.length} conflict(s) detected`
                  : "No conflicts detected"}
              </span>
            </div>
            {related.map((c) => (
              <p key={c.id} className="mt-2 text-xs text-muted-foreground">
                <span className="font-mono text-error">{c.id}</span> — {c.kind}: {c.note}
              </p>
            ))}
          </Section>
        </>
      );
    }
  } else if (type === "building") {
    const b = data.buildings.find((x) => x.id === id);
    if (b) {
      const floors = data.floors.filter((f) => f.buildingId === b.id);
      const props = data.properties.filter((p) => p.buildingId === b.id);
      heading = `Building summary — ${b.id}`;
      body = (
        <>
          <Section title="Structure">
            <Field label="Parcel" value={b.parcelId} />
            <Field label="Occupancy" value={b.occupancy} />
            <Field label="Floors above ground" value={b.floorsAboveGround} />
            <Field label="Basement levels" value={b.basementLevels} />
            <Field label="Total height" value={`${b.totalHeightM.toFixed(2)} m`} />
            <Field label="Footprint area" value={m2(b.footprintAreaM2)} />
          </Section>
          <Section title="Contents">
            <Field label="Registrable properties" value={props.length} />
            <Field label="Total owned volume" value={m3(props.reduce((s, p) => s + p.volumeM3, 0))} />
            <Field label="Floors modelled" value={floors.length} />
          </Section>
          <Section title="Floor schedule">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1">Floor</th>
                  <th className="py-1">Elevation</th>
                  <th className="py-1">Area</th>
                  <th className="py-1">Units</th>
                </tr>
              </thead>
              <tbody>
                {[...floors]
                  .sort((a, c) => c.level - a.level)
                  .map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0">
                      <td className="py-1 font-mono">{f.label}</td>
                      <td className="py-1 font-mono">{f.elevationM.toFixed(2)} m</td>
                      <td className="py-1 font-mono">{m2(f.areaM2)}</td>
                      <td className="py-1 font-mono">
                        {data.properties.filter((p) => p.floorId === f.id).length}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>
        </>
      );
    }
  } else if (type === "parcel") {
    const p = data.parcels.find((x) => x.id === id);
    if (p) {
      const props = data.properties.filter((x) => x.parcelId === p.id);
      heading = `Parcel record — ${p.id}`;
      body = (
        <>
          <Section title="Land record">
            <Field label="Survey number" value={p.surveyNo} />
            <Field label="Area" value={m2(p.areaM2)} />
            <Field label="Land type" value={p.landType} />
            <Field label="Location" value={p.location} />
            <Field label="Owner reference" value={p.ownerId} />
            <Field label="Anchor coordinate" value={latLngLabel(p.origin)} />
          </Section>
          <Section title="Vertical record">
            <Field label="Buildings" value={p.buildingIds.join(", ") || "none"} />
            <Field label="Registrable properties" value={props.length} />
            <Field label="Owned volume" value={m3(props.reduce((s, x) => s + x.volumeM3, 0))} />
          </Section>
        </>
      );
    }
  } else if (type === "utility") {
    const u = data.utilities.find((x) => x.id === id);
    if (u) {
      const related = conflicts.filter((c) => c.entityIds.includes(u.id));
      heading = `Utility line — ${u.id}`;
      body = (
        <>
          <Section title="Line">
            <Field label="Name" value={u.name} />
            <Field label="Type" value={u.type} />
            <Field label="Depth" value={`${u.depthM.toFixed(2)} m`} />
            <Field label="Diameter" value={`${(u.radiusM * 2).toFixed(2)} m`} />
            <Field label="Length" value={`${u.lengthM.toFixed(1)} m`} />
            <Field label="Status" value={u.status} />
            <Field label="Vertices" value={u.path.length} />
          </Section>
          <Section title="Connections">
            <Field
              label="Connected properties"
              value={u.connectedPropertyIds.join(", ") || "none"}
            />
          </Section>
          <Section title="Clashes">
            {related.length ? (
              related.map((c) => (
                <p key={c.id} className="text-xs text-muted-foreground">
                  <span className="font-mono text-error">{c.id}</span> — {c.kind}: {c.note}
                </p>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No clashes detected for this line.</p>
            )}
          </Section>
        </>
      );
    }
  } else if (type === "validation") {
    const checks = runValidation(data, { scope: "city" });
    heading = "Validation report — whole dataset";
    body = (
      <Section title={`${checks.length} checks`}>
        {checks.map((c) => (
          <div key={c.id} className="border-b border-border py-2 last:border-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={c.status} />
              <span className="text-sm text-foreground">{c.check}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.message}</p>
            {c.evidenceIds.length ? (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {c.evidenceIds.slice(0, 12).join(", ")}
                {c.evidenceIds.length > 12 ? ` +${c.evidenceIds.length - 12}` : ""}
              </p>
            ) : null}
          </div>
        ))}
      </Section>
    );
  }

  if (!body) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          title="Report unavailable"
          description={`No ${type} record with identifier ${id} exists in the demo dataset.`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/app/reports">Back to reports</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <Button asChild size="sm" variant="ghost">
          <Link to="/app/reports">← All reports</Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-3.5" /> Print / save as PDF
        </Button>
      </div>

      <article className="rounded-md border border-border p-8">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              3D-CADASTRE AI · prototype
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{heading}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Generated {new Date().toLocaleString()}
            </p>
          </div>
          <DemoTag />
        </header>
        {body}
        <footer className="mt-8 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          This document is produced from synthetic demonstration data. Identifiers shown use a
          prototype format and carry no legal status. It is not a certified land record.
        </footer>
      </article>
    </div>
  );
}
