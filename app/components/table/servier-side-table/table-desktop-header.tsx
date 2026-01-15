// components/table/table-desktop-header.tsx
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rows3 } from 'lucide-react';

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
    <div className="bg-card-footer-bg border-b border-card-header-border p-4">
      <div className="flex flex-col gap-4">
        {/* Count indicator with icon */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rows3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {totalElements ? startIndex : 0}–{endIndex} av {totalElements}
            </p>
            <p className="text-xs text-muted-foreground">Viser resultater</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {headerSlot && <div className="flex items-center gap-2">{headerSlot}</div>}

          {/* Page size selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Rader per side</span>
            <Select value={String(size)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-9 w-[100px] border-card-border bg-background hover:bg-muted transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt} rader
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
