// components/table/table-mobile-view.tsx
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TableMobilePagination } from './table-mobile-pagination';
import { Database } from 'lucide-react';
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
    <Card className="bg-card-bg border border-card-border hover:border-card-hover-border hover:shadow-md transition-all">
      <CardContent className="p-4">
        {/* Index badge */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-card-header-border">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">#{index + 1}</span>
          </div>
        </div>

        {/* Main content - 2 column grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
          {mainCells.map((cell: any, cellIndex: number) => {
            const columnHeader = columns[cellIndex]?.header;
            const cellContent = cell.props?.children;

            return (
              <div key={cellIndex} className="flex flex-col gap-1 min-w-0">
                <dt className="text-xs font-semibold text-card-text-muted uppercase tracking-wider">{columnHeader}</dt>
                <dd className="text-sm font-medium text-card-text break-words">{cellContent}</dd>
              </div>
            );
          })}
        </div>

        {/* Actions footer */}
        {actionsCell && (
          <div className="pt-3 border-t border-card-header-border">
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
    <div className="md:hidden space-y-4">
      {mobileHeaderSlot && (
        <div className="bg-card-bg border border-card-border rounded-lg p-4">{mobileHeaderSlot}</div>
      )}

      {/* Scrollable container */}
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-1">
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
          <Card className="bg-card-bg border border-card-border">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Database className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">{emptyMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {items.length > 0 && <TableMobilePagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
}
