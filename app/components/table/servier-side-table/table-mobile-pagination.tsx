// components/table/table-mobile-pagination.tsx
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Better than text arrows

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
    // Sticky bottom on mobile (thumb-reachable), static on desktop
    <div
      className="
      sticky bottom-0 left-0 right-0 z-10 md:static
      border border-border bg-background/95 backdrop-blur-sm
      p-3 md:p-4 lg:p-6
      space-y-2 md:space-y-3
      shadow-lg md:shadow-sm
      rounded-t-lg md:rounded-md
    "
    >
      {/* Page indicator - responsive typography */}
      <div className="text-sm md:text-base text-muted-foreground text-center font-medium">
        Side <span className="text-foreground font-semibold">{page + 1}</span> av {totalPages || 1}
      </div>

      {/* Navigation buttons - generous mobile spacing */}
      <div className="flex justify-center items-center gap-3 md:gap-4">
        {/* Previous button - minimum 48px tap target */}
        <Button
          variant="outline"
          size="default" // NOT "sm" - we need proper touch targets
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="
            min-w-[48px] min-h-[48px] md:min-w-[44px] md:min-h-[44px]
            px-4 md:px-6
            font-semibold
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-muted active:scale-95 transition-all
          "
          aria-label="Forrige side"
        >
          <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
        </Button>

        {/* Page number display - only on larger screens for breathing room */}
        <span className="hidden sm:inline-flex items-center justify-center min-w-[44px] text-sm font-medium text-foreground">
          {page + 1}
        </span>

        {/* Next button - minimum 48px tap target */}
        <Button
          variant="outline"
          size="default"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="
            min-w-[48px] min-h-[48px] md:min-w-[44px] md:min-h-[44px]
            px-4 md:px-6
            font-semibold
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-muted active:scale-95 transition-all
          "
          aria-label="Neste side"
        >
          <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
        </Button>
      </div>
    </div>
  );
}
