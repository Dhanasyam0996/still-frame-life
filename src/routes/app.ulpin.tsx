import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { PageHeader, UlpinBadge, ViewInMapLink } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { boxDimsLabel, m3 } from "@/lib/format";
import { DuplicateUlpinError } from "@/lib/ulpin";
import { useAuth } from "@/store/useAuth";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/ulpin")({
  head: () => ({
    meta: [
      { title: "ULPIN Generator — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Generate a prototype spatial identifier for a 3D property. Demonstration format, not an official standard.",
      },
      { property: "og:title", content: "ULPIN Generator — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Build a deterministic, unique spatial identifier from a property's 3D location.",
      },
    ],
  }),
  component: UlpinPage,
});

const SEGMENTS: { key: string; label: string; explain: string }[] = [
  { key: "state", label: "State", explain: "State code" },
  { key: "district", label: "District", explain: "District code" },
  { key: "parcel", label: "Parcel", explain: "Land parcel on the ground" },
  { key: "building", label: "Building", explain: "Structure on the parcel" },
  { key: "floor", label: "Floor", explain: "Vertical level — the new dimension" },
  { key: "unit", label: "Unit", explain: "Individual property" },
  { key: "suffix", label: "Checksum", explain: "Hash of the 3D coordinates" },
];

function UlpinPage() {
  const data = useCadastre((s) => s.data);
  const issueUlpin = useCadastre((s) => s.issueUlpin);
  const canMutate = useAuth((s) => s.canMutate)();

  const withoutUlpin = data.properties.filter((p) => !p.ulpinId);
  const [propertyId, setPropertyId] = useState(withoutUlpin[0]?.id ?? data.properties[0]!.id);
  const [result, setResult] = useState<{ value: string; existed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const property = data.properties.find((p) => p.id === propertyId);
  const ulpin = data.ulpins.find((u) => u.propertyId === propertyId);

  function generate() {
    setError(null);
    try {
      const r = issueUlpin(propertyId);
      setResult({ value: r.ulpin.value, existed: r.existed });
      setStep(0);
      const timer = window.setInterval(() => {
        setStep((s) => {
          if (s >= SEGMENTS.length) {
            window.clearInterval(timer);
            return s;
          }
          return s + 1;
        });
      }, 220);
    } catch (e) {
      setError(
        e instanceof DuplicateUlpinError
          ? "That identifier already exists for another property — generation refused."
          : e instanceof Error
            ? e.message
            : "Generation failed.",
      );
    }
  }

  const shown = ulpin ?? (result ? data.ulpins.find((u) => u.value === result.value) : undefined);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <PageHeader
        title="Prototype ULPIN generator"
        description="Builds a deterministic spatial identifier from a property's parcel, building, floor, unit and 3D coordinates. Re-running for the same property returns the same identifier."
      />

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <section>
          <label className="mb-1.5 block text-xs text-muted-foreground">Property</label>
          <Select
            value={propertyId}
            onValueChange={(v) => {
              setPropertyId(v);
              setResult(null);
              setError(null);
              setStep(0);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[320px]">
              {data.properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.id} · {p.buildingId} · {p.propertyType}
                  {p.ulpinId ? " · has identifier" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {property ? (
            <dl className="mt-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Bounding box</dt>
                <dd className="font-mono">{boxDimsLabel(property.box)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Volume</dt>
                <dd className="font-mono">{m3(property.volumeM3)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Base elevation</dt>
                <dd className="font-mono">{property.box.min[2].toFixed(2)} m</dd>
              </div>
            </dl>
          ) : null}

          <Button className="mt-4" disabled={!canMutate} onClick={generate}>
            {ulpin ? "Regenerate (idempotent)" : "Generate identifier"}
          </Button>
          {!canMutate ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Read-only role: sign in as surveyor or administrator to generate identifiers.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
          {result?.existed ? (
            <p className="mt-2 text-xs text-muted-foreground">
              This property already had an identifier — the same value was returned, not a new one.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Identifier</h2>
          {shown ? (
            <div className="rounded-md border border-primary/40 bg-primary/5 p-4">
              <p className="break-all font-mono text-base text-primary">{shown.value}</p>
              <UlpinBadge className="mt-2" />
              <div className="mt-4 space-y-1">
                {SEGMENTS.map((s, i) => (
                  <div
                    key={s.key}
                    className={`flex items-baseline justify-between gap-3 rounded-sm border px-2 py-1 text-[11px] transition-opacity ${
                      result && i >= step
                        ? "border-border opacity-30"
                        : "border-border opacity-100"
                    }`}
                  >
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-mono text-foreground">
                      {String(shown.parts[s.key as keyof typeof shown.parts])}
                    </span>
                    <span className="w-1/2 text-right text-muted-foreground">{s.explain}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="rounded-sm bg-white p-2">
                  <QRCodeSVG value={shown.value} size={84} />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  <p>
                    Spatial reference:
                    <br />
                    <span className="font-mono text-foreground">{shown.spatialRef}</span>
                  </p>
                  <p className="mt-2">
                    Generated {new Date(shown.generatedAt).toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <ViewInMapLink id={shown.propertyId}>View in 3D map →</ViewInMapLink>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No identifier yet for {propertyId}. Generate one to see how the segments are composed.
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            This format is a prototype created for this demonstration. It is not the official
            Unique Land Parcel Identification Number specification, and identifiers generated here
            have no legal standing.
          </p>
        </section>
      </div>
    </div>
  );
}
