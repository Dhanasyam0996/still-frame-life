import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/store/useAuth";
import { useCadastre } from "@/store/useCadastre";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "Units, coordinate display, reduced motion and demo data reset for the 3D cadastre prototype.",
      },
      { property: "og:title", content: "Settings — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Session preferences for the 3D cadastre prototype. Nothing is stored on a server.",
      },
    ],
  }),
  component: SettingsPage,
});

function Row({
  title,
  body,
  control,
}: {
  title: string;
  body: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-4 last:border-0">
      <div className="max-w-md">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function SettingsPage() {
  const settings = useCadastre((s) => s.settings);
  const setSetting = useCadastre((s) => s.setSetting);
  const resetDemoData = useCadastre((s) => s.resetDemoData);
  const user = useAuth((s) => s.user);
  const [resetAt, setResetAt] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <PageHeader
        title="Settings"
        description="These preferences live in this browser tab only. There is no backend, so nothing is saved to an account."
      />

      <div className="mt-4 rounded-md border border-border px-5">
        <Row
          title="Units"
          body="Metres are used throughout the geometry engine. Feet converts what is displayed; stored values stay metric."
          control={
            <Select
              value={settings.units}
              onValueChange={(v) => setSetting("units", v as typeof settings.units)}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m">Metres</SelectItem>
                <SelectItem value="ft">Feet</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <Row
          title="Coordinate display"
          body="Local shows scene coordinates relative to the parcel anchor. Geographic shows the synthetic latitude and longitude assigned to the demo area."
          control={
            <Select
              value={settings.coordinateDisplay}
              onValueChange={(v) =>
                setSetting("coordinateDisplay", v as typeof settings.coordinateDisplay)
              }
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local (x, y, z)</SelectItem>
                <SelectItem value="geographic">Geographic</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <Row
          title="Reduce motion"
          body="Turns off camera fly-throughs, pulsing conflict markers and automatic advance in guided demo mode."
          control={
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={(v) => setSetting("reduceMotion", v)}
              aria-label="Reduce motion"
            />
          }
        />
        <Row
          title="Simulate a data service failure"
          body="Makes identifier generation and analysis fail once, so you can see how the interface reports an error instead of hiding it."
          control={
            <Switch
              checked={settings.simulateApiFailure}
              onCheckedChange={(v) => setSetting("simulateApiFailure", v)}
              aria-label="Simulate failure"
            />
          }
        />
        <Row
          title="Reset demonstration data"
          body="Clears generated identifiers, conflict status changes and selections, returning the dataset to its original state."
          control={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetDemoData();
                setResetAt(new Date().toLocaleTimeString());
              }}
            >
              Reset
            </Button>
          }
        />
      </div>

      {resetAt ? (
        <p className="mt-3 text-xs text-muted-foreground">Data reset at {resetAt}.</p>
      ) : null}

      <div className="mt-6 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">Session</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {user
            ? `Signed in as ${user.displayName} (${user.role}). Roles are demonstration only and grant no real authority.`
            : "Not signed in. You can browse everything read-only; signing in enables identifier generation and conflict status changes."}
        </p>
      </div>
    </div>
  );
}
