import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Boxes, Fingerprint, ShieldCheck, Waypoints } from "lucide-react";

import { DemoTag } from "@/components/common";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "3D-CADASTRE AI — Land records with a vertical dimension" },
      {
        name: "description",
        content:
          "A prototype that turns flat 2D land records into a 3D cadastre: buildings, floors, apartment ownership volumes, prototype ULPINs and underground utilities.",
      },
      { property: "og:title", content: "3D-CADASTRE AI — Land records with a vertical dimension" },
      {
        property: "og:description",
        content:
          "Drill from a land parcel to a single apartment's 3D ownership volume. Prototype built on synthetic demo data.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Boxes,
    title: "3D ownership volumes",
    body: "An apartment is stored as a bounded volume in space — length, width, height and elevation — not as a share of a flat polygon.",
  },
  {
    icon: Fingerprint,
    title: "Prototype spatial ID",
    body: "A demonstration identifier encoding state, district, parcel, building, floor and unit. Not an official ULPIN standard.",
  },
  {
    icon: Waypoints,
    title: "Underground utilities",
    body: "Water, sewer, power, telecom and gas networks modelled with real depths, so clashes with owned space become visible.",
  },
  {
    icon: ShieldCheck,
    title: "Geometry-based checks",
    body: "Containment, overlap, clearance and intersection tests run on the actual geometry — results are computed, never scripted.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-mono text-sm tracking-tight">3D-CADASTRE&nbsp;AI</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/about">About</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <DemoTag className="mx-auto" />
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Land records stop at the ground.
            <br />
            <span className="text-primary">Ownership doesn&apos;t.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            A 2D parcel record cannot say who owns the fourth floor, where the water main runs
            beneath a basement, or whether a neighbouring wall crosses a boundary three metres up.
            This prototype models land records in three dimensions and checks them with real
            geometry.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/app/map">
                Open the 3D map <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/app/dashboard">View dashboard</Link>
            </Button>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground">
            All data shown is synthetic and created for demonstration. The identifier format is a
            prototype, not an official government standard, and AI features run in simulation mode.
          </p>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-5xl gap-px bg-border sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-background p-8">
                <f.icon className="size-5 text-primary" />
                <h2 className="mt-4 text-sm font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Prototype for demonstration purposes · synthetic data ·{" "}
        <Link to="/about" className="text-primary hover:underline">
          what is and isn&apos;t real
        </Link>
      </footer>
    </div>
  );
}
