import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { IdChip, PageHeader } from "@/components/common";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { useCadastre } from "@/store/useCadastre";
import type { Utility } from "@/types/cadastre";

export const Route = createFileRoute("/app/utilities")({
  head: () => ({
    meta: [
      { title: "Utilities — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Underground water, sewer, drainage, power, telecom and gas lines with depths, lengths and property connections.",
      },
      { property: "og:title", content: "Utilities — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "The buried network modelled at real depth, so clashes with owned space are visible.",
      },
    ],
  }),
  component: UtilitiesPage,
});

function UtilitiesPage() {
  const data = useCadastre((s) => s.data);
  const conflicts = useCadastre((s) => s.conflicts);
  const setUnderground = useCadastre((s) => s.setUnderground);
  const select = useCadastre((s) => s.select);
  const navigate = useNavigate();

  const columns: Column<Utility>[] = [
    { key: "id", header: "Line", value: (r) => r.id, cell: (r) => <IdChip value={r.id} /> },
    { key: "name", header: "Name", value: (r) => r.name },
    { key: "type", header: "Type", value: (r) => r.type },
    {
      key: "depth",
      header: "Depth",
      value: (r) => r.depthM,
      cell: (r) => `${r.depthM.toFixed(2)} m`,
      align: "right",
    },
    {
      key: "diameter",
      header: "Diameter",
      value: (r) => r.radiusM * 2,
      cell: (r) => `${(r.radiusM * 2).toFixed(2)} m`,
      align: "right",
    },
    {
      key: "length",
      header: "Length",
      value: (r) => r.lengthM,
      cell: (r) => `${r.lengthM.toFixed(1)} m`,
      align: "right",
    },
    { key: "status", header: "Status", value: (r) => r.status },
    {
      key: "conflicts",
      header: "Conflicts",
      value: (r) => conflicts.filter((c) => c.entityIds.includes(r.id)).length,
      cell: (r) => {
        const n = conflicts.filter((c) => c.entityIds.includes(r.id)).length;
        return n ? <span className="font-mono text-error">{n}</span> : <span className="text-muted-foreground">—</span>;
      },
      align: "right",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <PageHeader
        title="Underground utilities"
        description="Utility lines are stored as 3D polylines with depth and diameter, which is what makes clearance and intersection checks possible."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setUnderground(true);
              navigate({ to: "/app/map" });
            }}
          >
            Open underground view
          </Button>
        }
      />
      <div className="mt-5">
        <DataTable
          rows={data.utilities}
          columns={columns}
          searchKeys={(r) => `${r.id} ${r.name} ${r.type}`}
          filters={[
            {
              key: "type",
              label: "Type",
              options: [...new Set(data.utilities.map((u) => u.type))],
              match: (r, v) => r.type === v,
            },
            {
              key: "status",
              label: "Status",
              options: [...new Set(data.utilities.map((u) => u.status))],
              match: (r, v) => r.status === v,
            },
          ]}
          onRowClick={(r) => {
            setUnderground(true);
            select({ utilityId: r.id });
            navigate({ to: "/app/map" });
          }}
        />
      </div>
    </div>
  );
}
