import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DemoTag, PageHeader, StatusBadge } from "@/components/common";
import { dataSourceService } from "@/services";
import type { DataSource } from "@/types/cadastre";

export const Route = createFileRoute("/app/data-sources")({
  head: () => ({
    meta: [
      { title: "Data sources — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Where every value in this prototype comes from: synthetic records authored for the demonstration, and the inputs a real deployment would need.",
      },
      { property: "og:title", content: "Data sources — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content:
          "Full disclosure of what is synthetic here and what a production system would ingest.",
      },
    ],
  }),
  component: DataSourcesPage,
});

function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    dataSourceService
      .list()
      .then((s) => alive && setSources(s))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title="Data sources"
        description="Nothing in this prototype comes from a real survey. This page states what each input is here and what would replace it in a real deployment."
        actions={<DemoTag />}
      />

      {error ? (
        <p className="mt-6 rounded-md border border-error/40 bg-error/5 p-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {sources === null && !error ? (
          <p className="text-sm text-muted-foreground">Loading data sources…</p>
        ) : null}
        {(sources ?? []).map((s) => (
          <div key={s.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">{s.id}</span>
              <h2 className="text-sm font-semibold text-foreground">{s.name}</h2>
              <StatusBadge status={s.status} className="ml-auto" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Cell label="Data type" value={s.dataType} />
              <Cell label="Format" value={s.format} />
              <Cell label="Purpose" value={s.purpose} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {s.status === "Simulated"
                ? "No file of this kind was processed. The equivalent values in the demo were authored by hand, and a real deployment would derive them from this input."
                : "Represented in the demo by synthetic records in this format, so the shape of the data matches what a real ingest would produce."}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        To be explicit: no drone flight, LiDAR scan, BIM model or government register was used. The
        entire dataset is synthetic and exists only to demonstrate how a 3D cadastre would behave.
      </p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface-raised p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs text-foreground">{value}</p>
    </div>
  );
}
