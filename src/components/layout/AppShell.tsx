import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, PlayCircle, Search, Boxes } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { DemoTag } from "@/components/common";
import { GlobalSearch, useGlobalSearch } from "@/components/layout/GlobalSearch";
import { NAV_ITEMS } from "@/components/layout/nav";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import { useDemoMode } from "@/store/useDemoMode";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { open, setOpen } = useGlobalSearch();
  const [sheetOpen, setSheetOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const hydrate = useAuth((s) => s.hydrate);
  const signOut = useAuth((s) => s.signOut);
  const startDemo = useDemoMode((s) => s.start);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-border px-4 py-3.5">
          <Boxes className="size-5 text-primary" />
          <div className="leading-tight">
            <p className="font-mono text-[13px] font-semibold tracking-tight text-foreground">
              3D-CADASTRE AI
            </p>
            <p className="text-[10px] text-muted-foreground">Prototype cadastre platform</p>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="border-t border-border p-3 text-[10px] text-muted-foreground">
          Synthetic data · Prototype ULPIN · Not an official record
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              className="rounded-md border border-border p-2 text-muted-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-surface p-0">
              <SheetTitle className="border-b border-border px-4 py-3 font-mono text-sm">
                3D-CADASTRE AI
              </SheetTitle>
              <NavList onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>

          <button
            onClick={() => setOpen(true)}
            className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/60"
          >
            <Search className="size-3.5" />
            <span className="truncate">Search parcels, apartments, ULPINs, owners…</span>
            <kbd className="ml-auto hidden font-mono text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={startDemo}
                  className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20"
                >
                  <PlayCircle className="size-3.5" />
                  <span className="hidden sm:inline">Demo Mode</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Run the guided 10-step demo</TooltipContent>
            </Tooltip>
            <DemoTag className="hidden sm:inline-flex" />
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden rounded-sm border border-border bg-surface-raised px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground md:inline">
                  {user.role}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      aria-label="Sign out"
                      className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <LogOut className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out ({user.displayName})</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <GlobalSearch open={open} onOpenChange={setOpen} />
    </div>
  );
}
