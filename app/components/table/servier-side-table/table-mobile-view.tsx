// components/table/table-mobile-view.tsx
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TableMobilePagination } from './table-mobile-pagination';
import type { ServerPaginatedTableProps } from './server-paginated-table';

function DefaultMobileCard<T>({
  item,
  index,
  renderRow,
  columns,
}: {
  item: T;
  index: number;
  renderRow: (item: T, index: number) => React.ReactElement;
  columns: { header: React.ReactNode; className?: string }[];
}) {
  const row = renderRow(item, index);
  const rowElement = row as React.ReactElement<{ children: React.ReactNode }>;
  const cells = React.Children.toArray(rowElement.props.children);

  // Split cells into main content and actions
  const mainCells = cells.slice(0, -1);
  const actionsCell = cells[cells.length - 1] as any;

  return (
    <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        {/* Main content area - 2 column grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3">
          {mainCells.map((cell: any, cellIndex: number) => {
            const columnHeader = columns[cellIndex]?.header;
            const cellContent = cell.props?.children;

            return (
              <div key={cellIndex} className="flex flex-col gap-0.5 min-w-0">
                <dt className="text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wide">
                  {columnHeader}
                </dt>
                <dd className="text-sm text-foreground break-words">{cellContent}</dd>
              </div>
            );
          })}
        </div>

        {/* Actions footer */}
        {actionsCell && (
          <div className="pt-2.5 border-t border-border">
            <div className="flex items-center justify-end gap-2">{actionsCell.props?.children}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TableMobileView<T>({
  items,
  renderMobileCard,
  renderRow,
  columns,
  getRowKey,
  pagination,
  onPageChange,
  emptyMessage = 'Ingen resultater.',
  mobileHeaderSlot,
}: ServerPaginatedTableProps<T>) {
  return (
    <div className="md:hidden space-y-3">
      {mobileHeaderSlot && <div className="border border-border bg-background p-3 rounded-md">{mobileHeaderSlot}</div>}

      {/* Scrollable container with auto height cards */}
      <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
        {items.length > 0 ? (
          items.map((item, index) => (
            <React.Fragment key={getRowKey(item, index)}>
              {renderMobileCard ? (
                renderMobileCard(item, index)
              ) : (
                <DefaultMobileCard item={item} index={index} renderRow={renderRow} columns={columns} />
              )}
            </React.Fragment>
          ))
        ) : (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {items.length > 0 && (
        <div className="pt-2">
          <TableMobilePagination pagination={pagination} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
