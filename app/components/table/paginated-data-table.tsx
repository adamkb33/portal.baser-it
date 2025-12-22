// components/ui/paginated-table.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Column = {
  header: React.ReactNode;
  className?: string;
};

export type PaginatedTableProps<T> = {
  /** All items to display (already filtered/sorted by the parent if needed) */
  items: T[];
  /** Columns to render in the header */
  columns: Column[];
  /** Render a single row. Must return a <TableRow>...</TableRow> */
  renderRow: (item: T, index: number) => React.ReactElement;
  /** Unique key per row */
  getRowKey: (item: T, index: number) => React.Key;

  /** Text when there are no items */
  emptyMessage?: React.ReactNode;

  /** Page size choices */
  pageSizeOptions?: number[];

  /** Initial page size */
  initialPageSize?: number;

  /** Optional extra content to render above the table (e.g., filters) */
  headerSlot?: React.ReactNode;

  /** Optional className for the container card */
  className?: string;
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
};

export function PaginatedTable<T>({
  items,
  columns,
  renderRow,
  getRowKey,
  emptyMessage = 'Ingen resultater.',
  pageSizeOptions = [5, 10, 20],
  initialPageSize = 5,
  headerSlot,
  className,
  onPageSizeChange,
}: PaginatedTableProps<T>) {
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [page, setPage] = React.useState(1);

  // When items or pageSize change, clamp page into valid range
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  React.useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [items.length, pageSize, totalPages]);

  React.useEffect(() => {
    setPageSize(initialPageSize);
    setPage(1);
  }, [initialPageSize]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(items.length, startIndex + pageSize);
  const visible = items.slice(startIndex, endIndex);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={cn('border border-border bg-background rounded-none overflow-hidden', className)}>
      {/* Top controls */}
      <div className="border-b border-border bg-background p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Viser {items.length ? startIndex + 1 : 0}–{endIndex} av {items.length}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {headerSlot && <div className="flex items-center gap-2">{headerSlot}</div>}

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Per side</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const next = Number(v);
                  if (next === pageSize) return;
                  setPageSize(next);
                  setPage(1);
                  onPageSizeChange?.(next);
                }}
              >
                <SelectTrigger className="h-8 w-[92px] rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={i} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length ? (
            visible.map((item, index) =>
              React.cloneElement(renderRow(item, startIndex + index), { key: getRowKey(item, startIndex + index) }),
            )
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Bottom pagination */}
      <div className="border-t border-border bg-background p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Side {page} / {totalPages}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={!canPrev}>
              « Første
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
              ← Forrige
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext}
            >
              Neste →
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={!canNext}>
              Siste »
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
