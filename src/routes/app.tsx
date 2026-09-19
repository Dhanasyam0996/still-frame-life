import { Outlet, createFileRoute } from "@tanstack/react-router";

import { DemoOverlay } from "@/components/demo/DemoOverlay";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
      <DemoOverlay />
    </AppShell>
  );
}
