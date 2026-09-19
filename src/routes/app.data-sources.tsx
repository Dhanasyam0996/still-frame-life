import { createFileRoute } from "@tanstack/react-router";

import { DemoTag, PageHeader, StatusBadge } from "@/components/common";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/data-sources")({
  head: () => ({
    meta: [
      { title: "Data sources — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Where every value in this prototype comes from: synthetic records authored for the demonstration, and the pipelines a real deployment would need.",
      },
      { property: "og:title", content: "Data sources — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Full disclosure of what is synthetic here and what a production system would ingest.",
      },
    ],
  }),
  component: DataSourcesPage,
});

function DataSourcesPage() {
  const data = useCadastre((s) => s.data);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title="Data sources"
        description="Nothing in this prototype comes from a real survey. This page says exactly what each layer is and what would replace it."
        actions={<DemoTag />}
      />

      <div className="mt-5 space-y-3">
        {data.dataSources.map((s) => (
          <div key={s.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">{s.name}</h2>
              <span className="rounded-sm border border-border bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {s.kind}
              </span>
              <StatusBadge status={s.status} className="ml-auto" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-border bg-surface-raised p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  In this prototype
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground">{s.inPrototype}</p>
              </div>
              <div className="rounded-sm border border-border bg-surface-raised p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  In a real deployment
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground">{s.inProduction}</p>
              </div>
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              Records here: {s.recordCount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
