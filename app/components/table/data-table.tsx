import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface Action<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  getRowKey: (row: T) => string | number;
}

export function DataTable<T>({ data, columns, actions, getRowKey }: DataTableProps<T>) {
  const renderCell = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return String(row[column.accessor]);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead key={index} className={column.className}>
              {column.header}
            </TableHead>
          ))}
          {actions && actions.length > 0 && <TableHead className="text-right">Handlinger</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((column, index) => (
              <TableCell key={index} className={column.className}>
                {renderCell(row, column)}
              </TableCell>
            ))}
            {actions && actions.length > 0 && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      size={action.size || 'sm'}
                      onClick={() => action.onClick(row)}
                      className={action.className}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
