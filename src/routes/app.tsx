import { Outlet, createFileRoute } from "@tanstack/react-router";

import { DemoOverlay } from "@/components/demo/DemoOverlay";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <AppShell>
        <Outlet />
        <DemoOverlay />
      </AppShell>
    </TooltipProvider>
  );
}
