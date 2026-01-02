// components/table/server-paginated-table.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Column = {
  header: React.ReactNode;
  className?: string;
};

export type ServerPaginatedTableProps<T> = {
  items: T[];
  columns: Column[];
  renderRow: (item: T, index: number) => React.ReactElement;
  getRowKey: (item: T, index: number) => React.Key;

  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };

  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  emptyMessage?: React.ReactNode;
  pageSizeOptions?: number[];
  headerSlot?: React.ReactNode;
  className?: string;
};

export function ServerPaginatedTable<T>({
  items,
  columns,
  renderRow,
  getRowKey,
  pagination,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'Ingen resultater.',
  pageSizeOptions = [5, 10, 20, 50],
  headerSlot,
  className,
}: ServerPaginatedTableProps<T>) {
  const { page, size, totalElements, totalPages } = pagination;
  const startIndex = page * size + 1;
  const endIndex = Math.min((page + 1) * size, totalElements);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className={cn('border border-border bg-background', className)}>
      {/* Header bar */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Viser {totalElements ? startIndex : 0}–{endIndex} av {totalElements}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {headerSlot && <div className="flex items-center gap-2">{headerSlot}</div>}

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Per side</span>
              <Select value={String(size)} onValueChange={(v) => onPageSizeChange(Number(v))}>
                <SelectTrigger className="h-8 w-[92px] rounded-none border-border">
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

      <div className="[&_>div]:border-0">
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
            {items.length ? (
              items.map((item, index) => React.cloneElement(renderRow(item, index), { key: getRowKey(item, index) }))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Side {page + 1} / {totalPages || 1}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(0)} disabled={!canPrev}>
              « Første
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
              ← Forrige
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
              Neste →
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages - 1)} disabled={!canNext}>
              Siste »
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
