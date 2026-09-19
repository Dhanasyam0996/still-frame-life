import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader, StatCard, StatusBadge, ViewInMapLink } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runValidation } from "@/lib/engine/validation";
import { useCadastre } from "@/store/useCadastre";
import type { ValidationResult } from "@/types/cadastre";

export const Route = createFileRoute("/app/validation")({
  head: () => ({
    meta: [
      { title: "Validation — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Geometry checks on the 3D cadastre: containment, overlap, floor consistency, identifier uniqueness and utility intersections.",
      },
      { property: "og:title", content: "Validation — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Every check is computed from the dataset geometry, with evidence for each result.",
      },
    ],
  }),
  component: ValidationPage,
});

function ValidationPage() {
  const data = useCadastre((s) => s.data);
  const [scope, setScope] = useState<string>("city");
  const [results, setResults] = useState<ValidationResult[] | null>(null);
  const [running, setRunning] = useState(false);

  function run() {
    setRunning(true);
    setResults(null);
    const [kind, id] = scope.split(":");
    window.setTimeout(() => {
      setResults(
        runValidation(data, {
          scope: (kind as "city" | "parcel" | "building") ?? "city",
          id,
        }),
      );
      setRunning(false);
    }, 320);
  }

  const shown = results ?? [];
  const counts = {
    VALID: shown.filter((r) => r.status === "VALID").length,
    WARNING: shown.filter((r) => r.status === "WARNING").length,
    ERROR: shown.filter((r) => r.status === "ERROR").length,
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader
        title="Validation"
        description="Runs the geometry rules against the dataset. Results reflect the current data, including identifiers you have generated this session."
        actions={
          <>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-8 w-[220px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="city">Whole dataset</SelectItem>
                {data.parcels.map((p) => (
                  <SelectItem key={p.id} value={`parcel:${p.id}`}>
                    Parcel {p.id}
                  </SelectItem>
                ))}
                {data.buildings.map((b) => (
                  <SelectItem key={b.id} value={`building:${b.id}`}>
                    Building {b.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={run} disabled={running}>
              {running ? "Running checks…" : "Run validation"}
            </Button>
          </>
        }
      />

      {results ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Passed" value={counts.VALID} />
            <StatCard label="Warnings" value={counts.WARNING} />
            <StatCard label="Errors" value={counts.ERROR} />
          </div>

          <div className="mt-6 space-y-2">
            {shown.map((r) => (
              <div key={r.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="text-sm font-medium text-foreground">{r.check}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    {r.scope}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{r.message}</p>
                {r.evidenceIds.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.evidenceIds.slice(0, 8).map((id) => (
                      <ViewInMapLink key={id} id={id}>
                        {id}
                      </ViewInMapLink>
                    ))}
                    {r.evidenceIds.length > 8 ? (
                      <span className="text-[11px] text-muted-foreground">
                        +{r.evidenceIds.length - 8} more
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-md border border-dashed border-border p-8 text-center">
          <p className="text-sm text-foreground">No validation run yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Choose a scope and run the checks. Nothing is pre-computed for display — the engine
            evaluates the geometry when you press the button.
          </p>
        </div>
      )}
    </div>
  );
}
