import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { MapView } from "@/components/map/MapView";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/map")({
  validateSearch: (search: Record<string, unknown>) => ({
    select: typeof search.select === "string" ? search.select : undefined,
  }),
  head: () => ({
    meta: [
      { title: "3D Map — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Interactive 3D cadastre map: parcels, buildings, floors, apartment ownership volumes and underground utilities.",
      },
      { property: "og:title", content: "3D Map — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Drill from a land parcel down to a single apartment's 3D ownership volume.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { select: selectId } = Route.useSearch();
  const data = useCadastre((s) => s.data);
  const select = useCadastre((s) => s.select);

  useEffect(() => {
    if (!selectId) return;
    if (data.properties.some((p) => p.id === selectId)) select({ propertyId: selectId });
    else if (data.floors.some((f) => f.id === selectId)) select({ floorId: selectId });
    else if (data.buildings.some((b) => b.id === selectId)) select({ buildingId: selectId });
    else if (data.parcels.some((p) => p.id === selectId)) select({ parcelId: selectId });
    else if (data.utilities.some((u) => u.id === selectId)) select({ utilityId: selectId });
  }, [selectId, data, select]);

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <MapView />
    </div>
  );
}
