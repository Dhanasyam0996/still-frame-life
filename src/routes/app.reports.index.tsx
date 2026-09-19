import { Link, createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Printable property, building, parcel, utility and validation reports generated from the 3D cadastre data.",
      },
      { property: "og:title", content: "Reports — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Generate a printable record for any parcel, building or 3D property.",
      },
    ],
  }),
  component: ReportsPage,
});

const TYPES = [
  { value: "property", label: "Property record", body: "Ownership volume, identifier, conflicts." },
  { value: "building", label: "Building summary", body: "Floor stack, units, total owned volume." },
  { value: "parcel", label: "Parcel record", body: "Land record plus what stands on it in 3D." },
  { value: "utility", label: "Utility line", body: "Route, depth, connections and clashes." },
  { value: "validation", label: "Validation report", body: "Every check with its evidence." },
] as const;

function ReportsPage() {
  const data = useCadastre((s) => s.data);
  const [type, setType] = useState<string>("property");
  const [id, setId] = useState<string>("A-402");

  const options =
    type === "property"
      ? data.properties.map((p) => p.id)
      : type === "building"
        ? data.buildings.map((b) => b.id)
        : type === "parcel"
          ? data.parcels.map((p) => p.id)
          : type === "utility"
            ? data.utilities.map((u) => u.id)
            : ["city"];

  const valid = options.includes(id) ? id : options[0]!;

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title="Reports"
        description="Each report is rendered from the live dataset and formatted for printing or saving as PDF from your browser."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`rounded-md border p-4 text-left transition-colors ${
              type === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <FileText className="size-4 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">{t.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md border border-border p-4">
        {type !== "validation" ? (
          <Select value={valid} onValueChange={setId}>
            <SelectTrigger className="h-9 w-[240px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground">Covers the whole dataset.</span>
        )}
        <Button asChild>
          <Link to="/app/reports/print/$type/$id" params={{ type, id: valid }}>
            Open report
          </Link>
        </Button>
      </div>
    </div>
  );
}
