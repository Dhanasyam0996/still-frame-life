import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { IdChip, PageHeader, StatusBadge } from "@/components/common";
import { DataTable, type Column } from "@/components/common/DataTable";
import { m2, m3 } from "@/lib/format";
import { useCadastre } from "@/store/useCadastre";
import type { Property } from "@/types/cadastre";

export const Route = createFileRoute("/app/properties/")({
  head: () => ({
    meta: [
      { title: "Properties — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Every apartment, office and parking bay stored as a 3D ownership volume with area, height and identifier.",
      },
      { property: "og:title", content: "Properties — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "3D ownership volumes: area, height, volume and prototype identifier.",
      },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const data = useCadastre((s) => s.data);
  const navigate = useNavigate();

  const columns: Column<Property>[] = [
    { key: "id", header: "Property", value: (r) => r.id, cell: (r) => <IdChip value={r.id} /> },
    { key: "building", header: "Building", value: (r) => r.buildingId },
    { key: "level", header: "Level", value: (r) => r.level, align: "right" },
    { key: "type", header: "Type", value: (r) => r.propertyType },
    { key: "area", header: "Area", value: (r) => r.areaM2, cell: (r) => m2(r.areaM2), align: "right" },
    {
      key: "volume",
      header: "Volume",
      value: (r) => r.volumeM3,
      cell: (r) => m3(r.volumeM3),
      align: "right",
    },
    {
      key: "ulpin",
      header: "Prototype ULPIN",
      value: (r) => r.ulpinId ?? "",
      cell: (r) =>
        r.ulpinId ? (
          <span className="font-mono text-[11px] text-primary">{r.ulpinId}</span>
        ) : (
          <span className="text-muted-foreground">not generated</span>
        ),
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
        title="Properties"
        description="A property here is a bounded volume of space, not a share of a flat parcel. Area × height gives the owned volume."
      />
      <div className="mt-5">
        <DataTable
          rows={data.properties}
          columns={columns}
          searchKeys={(r) => `${r.id} ${r.buildingId} ${r.propertyType} ${r.ulpinId ?? ""}`}
          filters={[
            {
              key: "type",
              label: "Type",
              options: [...new Set(data.properties.map((p) => p.propertyType))],
              match: (r, v) => r.propertyType === v,
            },
            {
              key: "building",
              label: "Building",
              options: [...new Set(data.properties.map((p) => p.buildingId))],
              match: (r, v) => r.buildingId === v,
            },
            {
              key: "ulpin",
              label: "Identifier",
              options: ["Generated", "Not generated"],
              match: (r, v) => (v === "Generated" ? Boolean(r.ulpinId) : !r.ulpinId),
            },
          ]}
          onRowClick={(r) => navigate({ to: "/app/properties/$id", params: { id: r.id } })}
        />
      </div>
    </div>
  );
}
