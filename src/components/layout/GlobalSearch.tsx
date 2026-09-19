import { useNavigate } from "@tanstack/react-router";
import { Boxes, Building2, Fingerprint, Layers, User, Waypoints } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCadastre } from "@/store/useCadastre";

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const data = useCadastre((s) => s.data);
  const navigate = useNavigate();

  const groups = useMemo(
    () => ({
      parcels: data.parcels.map((p) => ({
        id: p.id,
        label: `${p.id} · Survey ${p.surveyNo}`,
        keywords: `${p.surveyNo} ${p.landType} ${p.ownerId}`,
      })),
      buildings: data.buildings.map((b) => ({
        id: b.id,
        label: `${b.id} · ${b.occupancy}`,
        keywords: b.parcelId,
      })),
      properties: data.properties.map((p) => ({
        id: p.id,
        label: `${p.id} · ${p.propertyType} · ${p.ownerId}`,
        keywords: `${p.ownerId} ${p.ulpinId ?? ""} ${p.buildingId}`,
      })),
      ulpins: data.ulpins.map((u) => ({
        id: u.propertyId,
        label: u.value,
        keywords: u.propertyId,
      })),
      utilities: data.utilities.map((u) => ({
        id: u.id,
        label: `${u.id} · ${u.name}`,
        keywords: u.type,
      })),
    }),
    [data],
  );

  const go = (id: string) => {
    onOpenChange(false);
    navigate({ to: "/app/map", search: { select: id } });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search parcels, survey numbers, buildings, apartments, ULPINs, owners, utilities…" />
      <CommandList>
        <CommandEmpty>No matching record in the synthetic dataset.</CommandEmpty>
        <CommandGroup heading="Parcels">
          {groups.parcels.map((i) => (
            <CommandItem key={i.id} value={`${i.label} ${i.keywords}`} onSelect={() => go(i.id)}>
              <Layers className="size-4 text-primary" />
              <span className="font-mono text-xs">{i.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Buildings">
          {groups.buildings.map((i) => (
            <CommandItem key={i.id} value={`${i.label} ${i.keywords}`} onSelect={() => go(i.id)}>
              <Building2 className="size-4 text-primary" />
              <span className="font-mono text-xs">{i.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Properties & owners">
          {groups.properties.map((i) => (
            <CommandItem key={i.id} value={`${i.label} ${i.keywords}`} onSelect={() => go(i.id)}>
              <Boxes className="size-4 text-primary" />
              <span className="font-mono text-xs">{i.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="ULPINs">
          {groups.ulpins.map((i) => (
            <CommandItem
              key={i.label}
              value={`${i.label} ${i.keywords}`}
              onSelect={() => go(i.id)}
            >
              <Fingerprint className="size-4 text-primary" />
              <span className="font-mono text-xs">{i.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Utilities">
          {groups.utilities.map((i) => (
            <CommandItem key={i.id} value={`${i.label} ${i.keywords}`} onSelect={() => go(i.id)}>
              <Waypoints className="size-4 text-primary" />
              <span className="font-mono text-xs">{i.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Owner IDs (synthetic)">
          {Array.from(new Set(data.properties.map((p) => p.ownerId)))
            .slice(0, 40)
            .map((o) => {
              const prop = data.properties.find((p) => p.ownerId === o)!;
              return (
                <CommandItem key={o} value={o} onSelect={() => go(prop.id)}>
                  <User className="size-4 text-primary" />
                  <span className="font-mono text-xs">
                    {o} → {prop.id}
                  </span>
                </CommandItem>
              );
            })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
