// components/table/table-mobile-view.tsx
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TableMobilePagination } from './table-mobile-pagination';
import type { ServerPaginatedTableProps } from './server-paginated-table';

export function TableMobileView<T>({
  items,
  renderMobileCard,
  renderRow,
  getRowKey,
  pagination,
  onPageChange,
  emptyMessage = 'Ingen resultater.',
  mobileHeaderSlot,
}: ServerPaginatedTableProps<T>) {
  return (
    <div className="md:hidden space-y-3 md:space-y-6">
      {mobileHeaderSlot && (
        <div className="border border-border bg-background p-3 md:p-6 rounded-md">{mobileHeaderSlot}</div>
      )}
      <div className="space-y-2 md:space-y-4 h-96 overflow-y-scroll">
        {items.length > 0 ? (
          items.map((item, index) => (
            <React.Fragment key={getRowKey(item, index)}>
              {renderMobileCard ? renderMobileCard(item, index) : renderRow(item, index)}
            </React.Fragment>
          ))
        ) : (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6 md:p-12 text-center">
              <p className="text-sm md:text-base text-muted-foreground">{emptyMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>
      {items.length > 0 && <TableMobilePagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}
