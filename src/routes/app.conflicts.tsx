import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { IdChip, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vec } from "@/lib/format";
import { useAuth } from "@/store/useAuth";
import { useCadastre } from "@/store/useCadastre";
import type { ConflictStatus } from "@/types/cadastre";

export const Route = createFileRoute("/app/conflicts")({
  head: () => ({
    meta: [
      { title: "Conflicts — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Conflicts found by intersecting real geometry: utilities crossing owned space, boundary encroachment and clearance breaches.",
      },
      { property: "og:title", content: "Conflicts — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Every conflict here is computed, not scripted. Open one to see it in the 3D map.",
      },
    ],
  }),
  component: ConflictsPage,
});

const STATUSES: ConflictStatus[] = ["Open", "Requires Review", "Resolved", "Dismissed"];

const SEVERITY_CLASS: Record<string, string> = {
  high: "border-error/40 bg-error/10 text-error",
  medium: "border-warning/40 bg-warning/10 text-warning",
  low: "border-border bg-surface-raised text-muted-foreground",
};

function ConflictsPage() {
  const conflicts = useCadastre((s) => s.conflicts);
  const overrides = useCadastre((s) => s.conflictStatus);
  const setConflictStatus = useCadastre((s) => s.setConflictStatus);
  const setConflictView = useCadastre((s) => s.setConflictView);
  const select = useCadastre((s) => s.select);
  const data = useCadastre((s) => s.data);
  const canMutate = useAuth((s) => s.canMutate)();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader
        title="Conflicts"
        description="These are not flagged records. The engine intersects utility polylines, ownership volumes and parcel boundaries at load time, and reports what actually overlaps."
      />

      <div className="mt-5 space-y-2">
        {conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conflicts detected in this dataset.</p>
        ) : null}
        {conflicts.map((c) => {
          const status = overrides[c.id] ?? c.status;
          const focusId =
            c.entityIds.find((id) => data.properties.some((p) => p.id === id)) ?? c.entityIds[0]!;
          return (
            <div key={c.id} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-foreground">{c.id}</span>
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[11px] ${SEVERITY_CLASS[c.severity]}`}
                >
                  {c.severity.toUpperCase()}
                </span>
                <span className="text-sm font-medium text-foreground">{c.kind}</span>
                <div className="ml-auto flex items-center gap-2">
                  <Select
                    value={status}
                    onValueChange={(v) => setConflictStatus(c.id, v as ConflictStatus)}
                    disabled={!canMutate}
                  >
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (data.properties.some((p) => p.id === focusId))
                        select({ propertyId: focusId });
                      setConflictView(c.id);
                      navigate({ to: "/app/map" });
                    }}
                  >
                    Show in 3D
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{c.note}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                {c.entityIds.map((id) => (
                  <IdChip key={id} value={id} />
                ))}
                <span className="font-mono">at {vec(c.location)}</span>
                <span>· detected {new Date(c.detectedAt).toLocaleString()}</span>
              </div>
              {!canMutate ? null : null}
            </div>
          );
        })}
      </div>

      {!canMutate ? (
        <p className="mt-4 text-[11px] text-muted-foreground">
          Your role is read-only, so conflict status cannot be changed. Status changes are stored
          for this session only.
        </p>
      ) : (
        <p className="mt-4 text-[11px] text-muted-foreground">
          Status changes are stored for this browser session only and do not alter the underlying
          geometry.
        </p>
      )}
    </div>
  );
}
