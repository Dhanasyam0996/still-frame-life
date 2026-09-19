import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { IdChip, PageHeader, StatusBadge } from "@/components/common";
import { DataTable, type Column } from "@/components/common/DataTable";
import { m2 } from "@/lib/format";
import { useCadastre } from "@/store/useCadastre";
import type { Building } from "@/types/cadastre";

export const Route = createFileRoute("/app/buildings/")({
  head: () => ({
    meta: [
      { title: "Buildings — 3D-CADASTRE AI" },
      {
        name: "description",
        content: "Buildings modelled in 3D: height, floor count, basements, footprint area and status.",
      },
      { property: "og:title", content: "Buildings — 3D-CADASTRE AI" },
      { property: "og:description", content: "Browse buildings and drill into their floors." },
    ],
  }),
  component: BuildingsPage,
});

function BuildingsPage() {
  const data = useCadastre((s) => s.data);
  const navigate = useNavigate();

  const columns: Column<Building>[] = [
    { key: "id", header: "Building", value: (r) => r.id, cell: (r) => <IdChip value={r.id} /> },
    { key: "parcel", header: "Parcel", value: (r) => r.parcelId },
    { key: "occupancy", header: "Occupancy", value: (r) => r.occupancy },
    { key: "floors", header: "Floors", value: (r) => r.floorsAboveGround, align: "right" },
    { key: "basements", header: "Basements", value: (r) => r.basementLevels, align: "right" },
    {
      key: "height",
      header: "Height",
      value: (r) => r.totalHeightM,
      cell: (r) => `${r.totalHeightM.toFixed(1)} m`,
      align: "right",
    },
    {
      key: "footprint",
      header: "Footprint",
      value: (r) => r.footprintAreaM2,
      cell: (r) => m2(r.footprintAreaM2),
      align: "right",
    },
    {
      key: "status",
      header: "Status",
      value: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <PageHeader
        title="Buildings"
        description="Each building carries a footprint, a floor stack and a real height, so the record describes volume rather than area alone."
      />
      <div className="mt-5">
        <DataTable
          rows={data.buildings}
          columns={columns}
          searchKeys={(r) => `${r.id} ${r.parcelId} ${r.occupancy}`}
          filters={[
            {
              key: "occupancy",
              label: "Occupancy",
              options: [...new Set(data.buildings.map((b) => b.occupancy))],
              match: (r, v) => r.occupancy === v,
            },
            {
              key: "status",
              label: "Status",
              options: [...new Set(data.buildings.map((b) => b.status))],
              match: (r, v) => r.status === v,
            },
          ]}
          onRowClick={(r) => navigate({ to: "/app/buildings/$id", params: { id: r.id } })}
        />
      </div>
    </div>
  );
}
