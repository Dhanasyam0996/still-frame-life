import { Link, createFileRoute } from "@tanstack/react-router";

import { DemoTag } from "@/components/common";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About this prototype — 3D-CADASTRE AI" },
      {
        name: "description",
        content:
          "What is real and what is simulated in the 3D-CADASTRE AI prototype: synthetic data, prototype identifiers, real geometry checks.",
      },
      { property: "og:title", content: "About this prototype — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "An honest breakdown of what this demonstration computes and what it simulates.",
      },
    ],
  }),
  component: AboutPage,
});

const REAL = [
  "3D geometry: every parcel, building, floor, apartment and utility has real coordinates and dimensions.",
  "Validation checks: containment, overlap, clearance and intersection are computed from that geometry at runtime.",
  "Conflict detection: the utility/apartment clash and the boundary encroachment are found by the engine, not scripted.",
  "Identifier generation: the code deterministically builds and de-duplicates identifiers as you use it.",
];

const NOT_REAL = [
  "The data is synthetic. No real survey records, owners or addresses are used.",
  "The identifier format is a prototype for discussion. It is not an official ULPIN specification.",
  "AI analysis runs in simulation mode: it describes rule-based findings in natural language and produces no model confidence scores.",
  "There is no LiDAR capture, drone survey, live registry integration or machine-learned model behind this demo.",
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="font-mono text-sm text-muted-foreground hover:text-foreground">
          ← 3D-CADASTRE AI
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">About this prototype</h1>
        <DemoTag className="mt-4" />
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Land administration records land as a flat shape. In a city, ownership is stacked: an
          apartment sits at a height, a parking bay sits below ground, and a water main crosses both.
          This prototype demonstrates how a cadastre record could carry that vertical dimension, and
          what becomes checkable once it does.
        </p>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-valid">
          What is genuinely computed
        </h2>
        <ul className="mt-3 space-y-2">
          {REAL.map((r) => (
            <li key={r} className="text-sm leading-relaxed text-muted-foreground">
              — {r}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-warning">
          What is simulated
        </h2>
        <ul className="mt-3 space-y-2">
          {NOT_REAL.map((r) => (
            <li key={r} className="text-sm leading-relaxed text-muted-foreground">
              — {r}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Potential benefits
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          If records carried verified 3D extents, disputes over vertical boundaries, utility damage
          during excavation and unrecorded encroachment could be identified before they become
          litigation. Those are potential outcomes of the approach, not measured results of this
          demonstration.
        </p>

        <div className="mt-10 border-t border-border pt-6 text-sm">
          <Link to="/app/map" className="text-primary hover:underline">
            Open the 3D map →
          </Link>
        </div>
      </div>
    </div>
  );
}
