import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { IdChip, PageHeader, StatusBadge } from "@/components/common";
import { DataTable, type Column } from "@/components/common/DataTable";
import { m2 } from "@/lib/format";
import { useCadastre } from "@/store/useCadastre";
import type { Parcel } from "@/types/cadastre";

export const Route = createFileRoute("/app/parcels/")({
  head: () => ({
    meta: [
      { title: "Parcels — 3D-CADASTRE AI" },
      {
        name: "description",
        content: "All land parcels in the synthetic demonstration block, with area, land type and status.",
      },
      { property: "og:title", content: "Parcels — 3D-CADASTRE AI" },
      { property: "og:description", content: "Browse land parcels and open their 3D records." },
    ],
  }),
  component: ParcelsPage,
});

function ParcelsPage() {
  const data = useCadastre((s) => s.data);
  const navigate = useNavigate();

  const columns: Column<Parcel>[] = [
    { key: "id", header: "Parcel", value: (r) => r.id, cell: (r) => <IdChip value={r.id} /> },
    { key: "survey", header: "Survey no.", value: (r) => r.surveyNo },
    { key: "area", header: "Area", value: (r) => r.areaM2, cell: (r) => m2(r.areaM2), align: "right" },
    { key: "type", header: "Land type", value: (r) => r.landType },
    {
      key: "buildings",
      header: "Buildings",
      value: (r) => r.buildingIds.length,
      align: "right",
    },
    { key: "location", header: "Location", value: (r) => r.location },
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
        title="Parcels"
        description="Ground-level land parcels. Open a parcel to see what stands on it in three dimensions."
      />
      <div className="mt-5">
        <DataTable
          rows={data.parcels}
          columns={columns}
          searchKeys={(r) => `${r.id} ${r.surveyNo} ${r.location} ${r.landType}`}
          filters={[
            {
              key: "landType",
              label: "Land type",
              options: [...new Set(data.parcels.map((p) => p.landType))],
              match: (r, v) => r.landType === v,
            },
            {
              key: "status",
              label: "Status",
              options: [...new Set(data.parcels.map((p) => p.status))],
              match: (r, v) => r.status === v,
            },
          ]}
          onRowClick={(r) => navigate({ to: "/app/parcels/$id", params: { id: r.id } })}
        />
      </div>
    </div>
  );
}
