// components/table/table-desktop-header.tsx
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TableDesktopHeaderProps = {
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];
  headerSlot?: React.ReactNode;
};

export function TableDesktopHeader({
  pagination,
  onPageSizeChange,
  pageSizeOptions,
  headerSlot,
}: TableDesktopHeaderProps) {
  const { page, size, totalElements } = pagination;
  const startIndex = page * size + 1;
  const endIndex = Math.min((page + 1) * size, totalElements);

  return (
    <div className="border-b border-border p-4">
      <div className="flex flex-col gap-4">
        <div className="text-xs text-muted-foreground">
          Viser {totalElements ? startIndex : 0}–{endIndex} av {totalElements}
        </div>

        <div className="flex flex-col gap-3">
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
  );
}
