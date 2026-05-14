// components/table/table-mobile-pagination.tsx
import { Button } from '~/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type TableMobilePaginationProps = {
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
};

export function TableMobilePagination({ pagination, onPageChange }: TableMobilePaginationProps) {
  const { page, totalPages } = pagination;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 rounded-lg border border-border/60 bg-surface-floating px-2.5 py-2 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="h-9 min-w-9 rounded-md border-border/60 px-2"
          aria-label="Forrige side"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-variant-3 px-2.5 py-1 text-xs">
          <span className="text-text-secondary">Side</span>
          <span className="font-semibold text-text-primary">{page + 1}</span>
          <span className="text-text-secondary">av</span>
          <span className="font-semibold text-text-primary">{totalPages || 1}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="h-9 min-w-9 rounded-md border-border/60 px-2"
          aria-label="Neste side"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
