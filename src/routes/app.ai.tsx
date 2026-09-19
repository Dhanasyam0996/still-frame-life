import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import { useState } from "react";

import { PageHeader, StatusBadge, ViewInMapLink } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { m2, m3, vec } from "@/lib/format";
import { runValidation } from "@/lib/engine/validation";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/ai")({
  head: () => ({
    meta: [
      { title: "AI Analysis (Simulation) — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Rule-based analysis described in natural language. Simulation mode: no machine-learned model, no confidence scores.",
      },
      { property: "og:title", content: "AI Analysis (Simulation) — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Plain-language summaries of geometry findings, generated from deterministic rules.",
      },
    ],
  }),
  component: AiPage,
});

interface Finding {
  title: string;
  body: string;
  status: "VALID" | "WARNING" | "ERROR";
  evidence: string[];
}

function AiPage() {
  const data = useCadastre((s) => s.data);
  const conflicts = useCadastre((s) => s.conflicts);
  const [target, setTarget] = useState("B-001");
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [running, setRunning] = useState(false);

  function analyse() {
    setRunning(true);
    setFindings(null);
    window.setTimeout(() => {
      const building = data.buildings.find((b) => b.id === target)!;
      const props = data.properties.filter((p) => p.buildingId === target);
      const floors = data.floors.filter((f) => f.buildingId === target);
      const related = conflicts.filter((c) =>
        c.entityIds.some((id) => id === target || props.some((p) => p.id === id)),
      );
      const checks = runValidation(data, { scope: "building", id: target });
      const errors = checks.filter((c) => c.status === "ERROR");
      const withoutId = props.filter((p) => !p.ulpinId);
      const totalVolume = props.reduce((s, p) => s + p.volumeM3, 0);

      const out: Finding[] = [
        {
          title: "Vertical composition",
          body: `${building.id} is modelled as ${floors.length} levels reaching ${building.totalHeightM.toFixed(1)} m above ground, containing ${props.length} registrable properties. Together they occupy ${m3(totalVolume)} of owned space over a ${m2(building.footprintAreaM2)} footprint — a ratio a 2D record cannot express.`,
          status: "VALID",
          evidence: [building.id],
        },
        {
          title: "Utility interaction",
          body: related.length
            ? `${related.length} geometric interaction${related.length > 1 ? "s" : ""} found between this building's owned volumes and surrounding infrastructure or boundaries. The most severe is ${related[0]!.kind.toLowerCase()} involving ${related[0]!.entityIds.join(" and ")} at ${vec(related[0]!.location)}.`
            : "No utility line or neighbouring structure intersects the ownership volumes of this building.",
          status: related.length ? "ERROR" : "VALID",
          evidence: related.flatMap((c) => c.entityIds),
        },
        {
          title: "Record completeness",
          body: withoutId.length
            ? `${withoutId.length} of ${props.length} properties have no prototype identifier yet. Until one is issued, those units cannot be referenced unambiguously in the 3D record.`
            : `All ${props.length} properties carry a prototype identifier.`,
          status: withoutId.length ? "WARNING" : "VALID",
          evidence: withoutId.map((p) => p.id).slice(0, 6),
        },
        {
          title: "Geometry integrity",
          body: errors.length
            ? `${errors.length} geometry check${errors.length > 1 ? "s" : ""} failed: ${errors.map((e) => e.check.toLowerCase()).join("; ")}.`
            : "All geometry checks for this building pass: floors are contiguous, units do not overlap, and the footprint sits inside its parcel.",
          status: errors.length ? "ERROR" : "VALID",
          evidence: errors.flatMap((e) => e.evidenceIds).slice(0, 6),
        },
      ];
      setFindings(out);
      setRunning(false);
    }, 700);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title="AI analysis"
        description="Describes what the geometry engine found, in plain language."
        actions={
          <>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Building {b.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={analyse} disabled={running}>
              {running ? "Analysing…" : "Run analysis"}
            </Button>
          </>
        }
      />

      <div className="mt-4 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3">
        <Cpu className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-xs leading-relaxed text-foreground">
          <span className="font-semibold">SIMULATION MODE.</span> No machine-learning model runs
          here. These summaries are written from deterministic rule outputs, which is why no
          confidence percentages are shown — a made-up number would be misleading.
        </p>
      </div>

      {findings ? (
        <div className="mt-6 space-y-3">
          {findings.map((f) => (
            <div key={f.title} className="rounded-md border border-border p-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={f.status} />
                <h2 className="text-sm font-semibold text-foreground">{f.title}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              {f.evidence.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...new Set(f.evidence)].map((id) => (
                    <ViewInMapLink key={id} id={id}>
                      {id}
                    </ViewInMapLink>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-dashed border-border p-8 text-center">
          <p className="text-sm text-foreground">No analysis run yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Pick a building and run the analysis. Every sentence produced is derived from the
            validation and conflict engines, not from a language model.
          </p>
        </div>
      )}
    </div>
  );
}
