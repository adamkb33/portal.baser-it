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
    <div className="md:hidden space-y-4">
      {mobileHeaderSlot && <div className="border border-border bg-background p-4">{mobileHeaderSlot}</div>}

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <React.Fragment key={getRowKey(item, index)}>
              {renderMobileCard ? renderMobileCard(item, index) : renderRow(item, index)}
            </React.Fragment>
          ))
        ) : (
          <Card className="border-border">
            <CardContent className="p-8 text-center text-muted-foreground">{emptyMessage}</CardContent>
          </Card>
        )}
      </div>

      {items.length > 0 && <TableMobilePagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}
