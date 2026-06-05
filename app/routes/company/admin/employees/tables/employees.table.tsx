// routes/company/admin/employees/tables/employees.table.tsx
import { useState } from 'react';
import { NavLink, useSubmit, useNavigate, useSearchParams } from 'react-router';
import { Pen } from 'lucide-react';
import { API_ROUTES_MAP, ROUTES_MAP } from '~/lib/routing/route-tree';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import type { CompanyUserDto } from '~/api/generated/base';
import { COMPANY_ROLE_LABELS } from '~/lib/constants';
import { Button, Input, TableCell, TableRow } from '~/ui';

type EmployeesTableProps = {
  users: CompanyUserDto[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export function EmployeesTable({ users, pagination }: EmployeesTableProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const [filter, setFilter] = useState(searchParams.get('search') ?? '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);

  const formatRoles = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => roles.map((role) => COMPANY_ROLE_LABELS[role]).join(', ');

  const formatName = (user: CompanyUserDto) => {
    const parts = [user.givenName, user.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const openDeleteDialog = (userId: number) => {
    setDeletingEmployeeId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingEmployeeId) return;

    const formData = new FormData();
    formData.append('userId', deletingEmployeeId.toString());

    submit(formData, {
      method: 'post',
      action: API_ROUTES_MAP['company.admin.employees.delete'].url,
    });

    setIsDeleteDialogOpen(false);
    setDeletingEmployeeId(null);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('size', newSize.toString());
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <>
      <ServerPaginatedTable<CompanyUserDto>
        items={users}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowKey={(user) => user.userId?.toString() ?? user.email}
        columns={[
          { header: 'Navn' },
          { header: 'E-post' },
          { header: 'Roller' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        headerSlot={
          <Input
            placeholder="Filtrer på navn eller e-post…"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="max-w-sm"
          />
        }
        primaryAction={
          <NavLink
            to={ROUTES_MAP['company.admin.employees.invite'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-interactive px-3 text-xs font-medium text-text-inverse transition-colors hover:bg-interactive-hover"
          >
            Inviter en ny ansatt
          </NavLink>
        }
        mobilePrimaryAction={
          <NavLink
            to={ROUTES_MAP['company.admin.employees.invite'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-interactive px-3 text-xs font-medium text-text-inverse transition-colors hover:bg-interactive-hover"
          >
            Inviter en ny ansatt
          </NavLink>
        }
        renderRow={(user) => (
          <TableRow>
            <TableCell className="font-medium">{formatName(user)}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{formatRoles(user.companyRoles)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <NavLink
                  to={`${ROUTES_MAP['company.admin.employees.edit'].href}?userId=${user.userId}`}
                  className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                >
                  <Pen className="h-4 w-4" />
                  <span className="sr-only">Rediger</span>
                </NavLink>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => openDeleteDialog(user.userId!)}
                >
                  Slett
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Fjern ansatt?"
        description="Er du sikker på at du vil fjerne denne ansatten fra selskapet? Denne handlingen kan ikke angres."
      />
    </>
  );
}
