// components/table/table-mobile-pagination.tsx
import { Button } from '@/components/ui/button';

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
    <div className="border border-border bg-background p-4 space-y-3">
      <div className="text-xs text-muted-foreground text-center">
        Side {page + 1} / {totalPages || 1}
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          ←
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          →
        </Button>
      </div>
    </div>
  );
}
