import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ValidationStatus } from "@/types/cadastre";

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      title="All data in this prototype is synthetic."
      className={cn(
        "inline-flex items-center rounded-sm border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-warning",
        className,
      )}
    >
      DEMO DATA
    </span>
  );
}

export function UlpinBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-info/40 bg-info/10 px-2 py-0.5 text-[11px] text-info",
        className,
      )}
    >
      <Info className="size-3" />
      Prototype ULPIN — Demonstration Identifier
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ValidationStatus | string;
  className?: string;
}) {
  const map: Record<string, { icon: ReactNode; cls: string; label: string }> = {
    VALID: {
      icon: <CheckCircle2 className="size-3.5" />,
      cls: "border-valid/40 bg-valid/10 text-valid",
      label: "VALID",
    },
    Validated: {
      icon: <CheckCircle2 className="size-3.5" />,
      cls: "border-valid/40 bg-valid/10 text-valid",
      label: "VALIDATED",
    },
    WARNING: {
      icon: <AlertTriangle className="size-3.5" />,
      cls: "border-warning/40 bg-warning/10 text-warning",
      label: "WARNING",
    },
    Pending: {
      icon: <AlertTriangle className="size-3.5" />,
      cls: "border-warning/40 bg-warning/10 text-warning",
      label: "PENDING",
    },
    ERROR: {
      icon: <XCircle className="size-3.5" />,
      cls: "border-error/40 bg-error/10 text-error",
      label: "ERROR",
    },
    Conflict: {
      icon: <XCircle className="size-3.5" />,
      cls: "border-error/40 bg-error/10 text-error",
      label: "CONFLICT",
    },
  };
  const entry = map[status] ?? {
    icon: <Info className="size-3.5" />,
    cls: "border-border bg-surface-raised text-muted-foreground",
    label: String(status).toUpperCase(),
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium",
        entry.cls,
        className,
      )}
    >
      {entry.icon}
      {entry.label}
    </span>
  );
}

export function IdChip({
  value,
  className,
  onClick,
}: {
  value: string;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] text-foreground",
        onClick && "transition-colors hover:border-primary hover:text-primary",
        className,
      )}
    >
      {value}
    </Comp>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="tabular mt-2 font-mono text-2xl text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 border-error/40 p-10 text-center">
      <XCircle className="size-5 text-error" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  demoTag = true,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  demoTag?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {demoTag ? <DemoTag /> : null}
        </div>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ViewInMapLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Link
      to="/app/map"
      search={{ select: id }}
      className="text-xs text-primary underline-offset-2 hover:underline"
    >
      {children}
    </Link>
  );
}
