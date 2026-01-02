// components/table/table-desktop-footer.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';

type TableDesktopFooterProps = {
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
};

export function TableDesktopFooter({ pagination, onPageChange }: TableDesktopFooterProps) {
  const { page, totalPages } = pagination;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
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
  );
}
