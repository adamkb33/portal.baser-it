// components/table/table-desktop-view.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown } from 'lucide-react';
import { CELL_HEIGHT, TOTAL_VISIBLE_ROWS } from '../constants';
import { TableDesktopHeader } from './table-desktop-header';
import { TableDesktopFooter } from './table-desktop-footer';
import type { ServerPaginatedTableProps } from './server-paginated-table';

const VISIBLE_DATA_ROWS = TOTAL_VISIBLE_ROWS - 1;

export function TableDesktopView<T>({
  items,
  columns,
  renderRow,
  pagination,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'Ingen resultater.',
  pageSizeOptions = [5, 10, 20, 50],
  headerSlot,
  className,
}: ServerPaginatedTableProps<T>) {
  const [showScrollHint, setShowScrollHint] = React.useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const hasScrollableContent = items.length > VISIBLE_DATA_ROWS;

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasScrollableContent) return;

    const handleScroll = () => {
      const scrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
      setShowScrollHint(!scrolledToBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasScrollableContent]);

  const columnWidth = `${100 / columns.length}%`;

  return (
    <div className={cn('hidden md:block border border-border bg-background', className)}>
      <TableDesktopHeader
        pagination={pagination}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        headerSlot={headerSlot}
      />

      <div className="relative overflow-x-auto">
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto"
          style={{ height: `${CELL_HEIGHT * TOTAL_VISIBLE_ROWS}px` }}
        >
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow style={{ height: `${CELL_HEIGHT}px` }}>
                {columns.map((c, i) => (
                  <TableHead
                    key={i}
                    className="sticky top-0 z-10 bg-background border-b"
                    style={{ width: columnWidth }}
                  >
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((item, index) => renderRow(item, index))
              ) : (
                <TableRow style={{ height: `${CELL_HEIGHT}px` }}>
                  <TableCell colSpan={columns.length} className="text-center">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {showScrollHint && hasScrollableContent && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-background/95 to-transparent pb-1 pt-4">
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
              <ChevronDown className="h-2.5 w-2.5" />
            </div>
          </div>
        )}
      </div>

      <TableDesktopFooter pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
