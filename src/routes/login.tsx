import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { DemoTag } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/useAuth";
import type { User } from "@/types/cadastre";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — 3D-CADASTRE AI" },
      {
        name: "description",
        content: "Choose a demonstration role to explore the 3D cadastre prototype.",
      },
      { property: "og:title", content: "Sign in — 3D-CADASTRE AI" },
      {
        property: "og:description",
        content: "Demo sign-in with admin, surveyor or viewer roles. No account required.",
      },
    ],
  }),
  component: LoginPage,
});

const ROLES: { role: User["role"]; title: string; body: string }[] = [
  {
    role: "admin",
    title: "Administrator",
    body: "Full access: generate identifiers, resolve conflicts, change settings.",
  },
  {
    role: "surveyor",
    title: "Surveyor",
    body: "Can generate identifiers and run validation, and flag conflicts for review.",
  },
  { role: "viewer", title: "Viewer", body: "Read-only access to records, maps and reports." },
];

function LoginPage() {
  const signIn = useAuth((s) => s.signIn);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="font-mono text-sm text-muted-foreground hover:text-foreground">
          ← 3D-CADASTRE AI
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Choose a demo role
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This prototype has no real accounts or passwords. Pick a role to see how permissions
          change what you can do.
        </p>
        <DemoTag className="mt-4" />

        <div className="mt-6 space-y-2">
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => {
                signIn(r.role);
                navigate({ to: "/app/dashboard" });
              }}
              className="w-full rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-primary"
            >
              <span className="text-sm font-medium text-foreground">{r.title}</span>
              <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          You can also{" "}
          <Link to="/app/map" className="text-primary hover:underline">
            browse the map without signing in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
