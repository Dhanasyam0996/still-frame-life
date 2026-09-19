import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Boxes, Building2, Layers, Waypoints } from "lucide-react";

import { PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { m2, m3 } from "@/lib/format";
import { runValidation } from "@/lib/engine/validation";
import { useCadastre } from "@/store/useCadastre";
import { useDemoMode } from "@/store/useDemoMode";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Overview of parcels, buildings, 3D properties, utilities, validation status and detected conflicts in the 3D cadastre prototype.",
      },
      { property: "og:title", content: "Dashboard — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Counts, validation status and detected geometry conflicts at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useCadastre((s) => s.data);
  const conflicts = useCadastre((s) => s.conflicts);
  const select = useCadastre((s) => s.select);
  const setConflictView = useCadastre((s) => s.setConflictView);
  const startDemo = useDemoMode((s) => s.start);
  const navigate = useNavigate();

  const validation = runValidation(data, { kind: "city" });
  const errors = validation.filter((v) => v.status === "ERROR").length;
  const warnings = validation.filter((v) => v.status === "WARNING").length;
  const totalVolume = data.properties.reduce((sum, p) => sum + p.volumeM3, 0);
  const totalArea = data.parcels.reduce((sum, p) => sum + p.areaM2, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <PageHeader
        title="Dashboard"
        description="Synthetic city block modelled in three dimensions. Every number below is computed from the dataset at load time."
        actions={
          <>
            <Button
              size="sm"
              onClick={() => {
                startDemo();
                navigate({ to: "/app/map" });
              }}
            >
              Start guided demo
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/map">Open 3D map</Link>
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Parcels" value={data.parcels.length} hint={m2(totalArea)} icon={<Layers className="size-4" />} />
        <StatCard
          label="Buildings"
          value={data.buildings.length}
          hint={`${data.floors.length} floors modelled`}
          icon={<Building2 className="size-4" />}
        />
        <StatCard
          label="3D properties"
          value={data.properties.length}
          hint={`${m3(totalVolume)} of owned space`}
          icon={<Boxes className="size-4" />}
        />
        <StatCard
          label="Utility lines"
          value={data.utilities.length}
          hint={`${data.utilities.reduce((s, u) => s + u.lengthM, 0).toFixed(0)} m total`}
          icon={<Waypoints className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Validation summary</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/validation">Run full validation</Link>
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status="VALID" />
            <span className="text-xs text-muted-foreground">
              {validation.length - errors - warnings} checks passed
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status="WARNING" />
            <span className="text-xs text-muted-foreground">{warnings} warnings</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status="ERROR" />
            <span className="text-xs text-muted-foreground">{errors} errors</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Checks cover parcel geometry, building containment, apartment overlap, floor
            consistency, identifier uniqueness and utility intersections.
          </p>
        </section>

        <section className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-error" /> Detected conflicts
            </h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/conflicts">See all</Link>
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {conflicts.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  const pid = c.entityIds.find((id) => id.startsWith("A-"));
                  if (pid) select({ propertyId: pid });
                  setConflictView(c.id);
                  navigate({ to: "/app/map" });
                }}
                className="w-full rounded-sm border border-border p-2 text-left text-xs transition-colors hover:border-error"
              >
                <span className="font-mono text-error">{c.id}</span> — {c.kind}
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {c.entityIds.join(" × ")}
                </div>
              </button>
            ))}
            {conflicts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No conflicts detected.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
