// components/table/table-mobile-pagination.tsx
import { Button } from '@/components/ui/button';
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
    <div className="sticky bottom-0 left-0 right-0 z-10 bg-card-bg/95 backdrop-blur-sm border border-card-border rounded-lg p-4 shadow-lg">
      {/* Page indicator with badge style */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground">Side</span>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
          <span className="text-sm font-bold text-primary">{page + 1}</span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-sm font-semibold text-foreground">{totalPages || 1}</span>
        </div>
      </div>

      {/* Navigation buttons - 48px touch targets on mobile */}
      <div className="flex justify-center items-center gap-3">
        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="min-w-[48px] min-h-[48px] px-6 font-semibold hover:bg-muted active:scale-95 transition-all"
          aria-label="Forrige side"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Current page number - visible on mobile for context */}
        <div className="flex items-center justify-center min-w-[44px]">
          <span className="text-base font-bold text-foreground">{page + 1}</span>
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="min-w-[48px] min-h-[48px] px-6 font-semibold hover:bg-muted active:scale-95 transition-all"
          aria-label="Neste side"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
