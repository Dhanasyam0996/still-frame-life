import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Search } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Column<T> {
  key: string;
  header: string;
  value: (row: T) => string | number;
  cell?: (row: T) => ReactNode;
  align?: "left" | "right";
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: string[];
  match: (row: T, value: string) => boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchKeys,
  onRowClick,
  emptyTitle = "Nothing to show",
  emptyBody = "No records match the current filters.",
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: FilterDef<T>[];
  searchKeys?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [active, setActive] = useState<Record<string, string>>({});

  const visible = useMemo(() => {
    let out = rows;
    const q = query.trim().toLowerCase();
    if (q && searchKeys) out = out.filter((r) => searchKeys(r).toLowerCase().includes(q));
    for (const f of filters) {
      const v = active[f.key];
      if (v && v !== "all") out = out.filter((r) => f.match(r, v));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = col.value(a);
          const bv = col.value(b);
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
          return String(av).localeCompare(String(bv)) * sort.dir;
        });
      }
    }
    return out;
  }, [rows, query, sort, active, filters, columns, searchKeys]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {searchKeys ? (
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter records…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        ) : null}
        {filters.map((f) => (
          <Select
            key={f.key}
            value={active[f.key] ?? "all"}
            onValueChange={(v) => setActive((p) => ({ ...p, [f.key]: v }))}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} of {rows.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-3 py-2 font-medium text-muted-foreground ${
                      c.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() =>
                        setSort((s) =>
                          s?.key === c.key
                            ? { key: c.key, dir: s.dir === 1 ? -1 : 1 }
                            : { key: c.key, dir: 1 },
                        )
                      }
                    >
                      {c.header}
                      <ArrowUpDown className="size-3 opacity-50" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border last:border-0 ${
                    onRowClick ? "cursor-pointer hover:bg-surface-raised" : ""
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-2 ${
                        c.align === "right" ? "text-right font-mono" : "text-foreground"
                      }`}
                    >
                      {c.cell ? c.cell(row) : c.value(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
