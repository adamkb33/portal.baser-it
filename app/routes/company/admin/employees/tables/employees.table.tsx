// routes/company/admin/employees/components/employees-table.tsx
import { useState } from 'react';
import { useSubmit } from 'react-router';
import { toast } from 'sonner';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import { Button } from '~/components/ui/button';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { TableCell, TableRow } from '~/components/ui/table';
import { Pen } from 'lucide-react';
import { COMPANY_ROLE_LABELS } from '~/lib/constants';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { EditEmployeeForm } from '../forms/edit-employee.form-dialog';

type EmployeesTableProps = {
  users: CompanyUserDto[];
};

export function EmployeesTable({ users }: EmployeesTableProps) {
  const submit = useSubmit();
  const [editingUser, setEditingUser] = useState<CompanyUserDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);

  const formatRoles = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => roles.map((role) => COMPANY_ROLE_LABELS[role]).join(', ');

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

  return (
    <>
      <PaginatedTable<CompanyUserDto>
        items={users}
        getRowKey={(user) => user.userId?.toString() ?? user.email}
        columns={[
          { header: 'E-post', className: 'font-medium' },
          { header: 'Roller' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        renderRow={(user) => (
          <TableRow>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{formatRoles(user.roles)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                  <Pen className="h-4 w-4" />
                  <span className="sr-only">Rediger</span>
                </Button>
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

      <EditEmployeeForm user={editingUser} />

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
