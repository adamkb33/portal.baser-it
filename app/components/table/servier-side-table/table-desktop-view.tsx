// components/table/table-desktop-view.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, Database } from 'lucide-react';
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
    <div
      className={cn(
        'hidden md:block bg-card-bg border border-card-border rounded-lg shadow-md overflow-hidden',
        className,
      )}
    >
      <TableDesktopHeader
        pagination={pagination}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        headerSlot={headerSlot}
      />

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto overflow-x-auto"
          style={{ height: `${CELL_HEIGHT * TOTAL_VISIBLE_ROWS}px` }}
        >
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow style={{ height: `${CELL_HEIGHT}px` }} className="border-b-2 border-card-border">
                {columns.map((c, i) => (
                  <TableHead
                    key={i}
                    className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm font-semibold text-foreground border-b border-card-border"
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
                <TableRow style={{ height: `${CELL_HEIGHT * 3}px` }}>
                  <TableCell colSpan={columns.length} className="text-center">
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <Database className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Scroll hint with gradient */}
        {showScrollHint && hasScrollableContent && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card-bg via-card-bg/95 to-transparent flex items-end justify-center pb-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <ChevronDown className="h-4 w-4 text-primary animate-bounce" />
              <span className="text-xs font-medium text-primary">Scroll for mer</span>
            </div>
          </div>
        )}
      </div>

      <TableDesktopFooter pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
