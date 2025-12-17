import { data, Link, redirect, useLoaderData, useSubmit, type LoaderFunctionArgs } from 'react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { CompanyRoles, createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { Button } from '~/components/ui/button';
import { getUserSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { TableCell, TableRow } from '~/components/ui/table';
import { Input } from '~/components/ui/input';
import { Pen } from 'lucide-react';
import { COMPANY_ROLE_LABELS } from '~/lib/constants';
import { PageHeader } from '../../_components/page-header';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Checkbox } from '~/components/ui/checkbox';

export type EmployeesOverviewLoaderData = {
  users: CompanyUserDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { user, accessToken: accesstoken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseApi = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

    const response = await baseApi.AdminCompanyUserControllerService.AdminCompanyUserControllerService.getCompanyUsers({
      includeDeleted: false,
    });
    if (!response.data) {
      return { error: 'Kunne ikke hente brukere for selskapet' };
    }

    return data<EmployeesOverviewLoaderData>({
      users: response.data.content,
    });
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function action({ request }: LoaderFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'editEmployee') {
      const userId = formData.get('userId');
      const rolesToUpdate = formData.get('roles');

      if (!userId || !rolesToUpdate) {
        return { error: 'Form data not provided' };
      }

      const { user, accessToken: accesstoken } = await getUserSession(request);
      if (!user || !user.company) {
        return redirect('/');
      }

      const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

      await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.editCompanyUser({
        companyId: user.company.companyId,
        userId: parseInt(userId.toString()),
        requestBody: {
          roles: rolesToUpdate.toString().split(',') as any[],
        },
      });

      return { success: true };
    }

    if (intent === 'inviteEmployee') {
      const email = formData.get('email');
      const rolesJson = formData.get('roles');

      if (!email || !rolesJson) {
        return { error: 'Form data not provided' };
      }

      let roles;
      try {
        roles = JSON.parse(rolesJson.toString());
      } catch {
        return { error: 'Ugyldig rolledata' };
      }

      const { user, accessToken: accesstoken } = await getUserSession(request);
      if (!user || !user.company) {
        return redirect('/');
      }

      const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

      await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.inviteEmployee({
        requestBody: { email: email.toString(), roles },
      });

      return { success: true };
    }

    if (intent === 'deleteEmployee') {
      const userId = formData.get('userId');

      if (!userId) {
        return { error: 'User ID not provided' };
      }

      const { user, accessToken: accesstoken } = await getUserSession(request);
      if (!user || !user.company) {
        return redirect('/');
      }

      const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

      await baseClient.AdminCompanyUserControllerService.AdminCompanyUserControllerService.deleteCompanyUser({
        userId: Number(userId),
      });

      return { success: true };
    }

    return { error: 'Invalid intent' };
  } catch (error: any) {
    console.error(error);
    if (error && error.body) {
      return { error: error.body.message };
    }
    throw error;
  }
}

type EditFormData = {
  userId: number;
  email: string;
  roles: Array<'ADMIN' | 'EMPLOYEE'>;
};

type InviteFormData = {
  email: string;
  roles: Array<'ADMIN' | 'EMPLOYEE'>;
};

export default function CompanyAdminEmployees() {
  const { users } = useLoaderData<EmployeesOverviewLoaderData>();
  const submit = useSubmit();
  const [filter, setFilter] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EditFormData | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState<InviteFormData>({ email: '', roles: [] });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);

  const formatRoles = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => {
    return roles.map((role) => COMPANY_ROLE_LABELS[role]).join(', ');
  };

  const openEditDialog = (user: CompanyUserDto) => {
    if (!user.userId) return;

    setEditingEmployee({
      userId: user.userId,
      email: user.email,
      roles: user.roles,
    });
    setIsEditDialogOpen(true);
  };

  const handleFieldChange = (name: keyof EditFormData, value: any) => {
    if (!editingEmployee) return;
    setEditingEmployee({ ...editingEmployee, [name]: value });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const formData = new FormData();
    formData.append('intent', 'editEmployee');
    formData.append('userId', editingEmployee.userId.toString());
    formData.append('roles', editingEmployee.roles.join(','));

    submit(formData, { method: 'post' });

    setIsEditDialogOpen(false);
    setEditingEmployee(null);
    toast.success('Ansattinformasjon oppdatert');
  };

  const openInviteDialog = () => {
    setInviteData({ email: '', roles: [] });
    setIsInviteDialogOpen(true);
  };

  const handleInviteFieldChange = (name: keyof InviteFormData, value: any) => {
    setInviteData({ ...inviteData, [name]: value });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('intent', 'inviteEmployee');
    formData.append('email', inviteData.email);
    formData.append('roles', JSON.stringify(inviteData.roles));

    submit(formData, { method: 'post' });

    setIsInviteDialogOpen(false);
    setInviteData({ email: '', roles: [] });
    toast.success('Invitasjon sendt');
  };

  const openDeleteDialog = (userId: number) => {
    setDeletingEmployeeId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingEmployeeId) return;

    const formData = new FormData();
    formData.append('intent', 'deleteEmployee');
    formData.append('userId', deletingEmployeeId.toString());

    submit(formData, { method: 'post' });

    setIsDeleteDialogOpen(false);
    setDeletingEmployeeId(null);
    toast.success('Ansatt fjernet');
  };

  const filteredUsers = useMemo(() => {
    if (!filter) return users;
    const query = filter.toLowerCase();
    return users.filter((user) => {
      const email = user.email?.toLowerCase() ?? '';
      const roles = formatRoles(user.roles).toLowerCase();
      return email.includes(query) || roles.includes(query);
    });
  }, [users, filter]);

  return (
    <>
      <PageHeader
        title="Ansatte"
        description="Oversikt over alle brukere tilknyttet selskapet. Administrer roller, tilganger og inviter nye medlemmer."
        actions={<Button onClick={openInviteDialog}>Inviter ansatt</Button>}
      />

      <div className="flex items-center py-2">
        <Input
          placeholder="Filtrer på e-post eller rolle…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      <PaginatedTable<CompanyUserDto>
        items={filteredUsers}
        getRowKey={(user) => user.userId?.toString() ?? user.email}
        columns={[
          { header: 'E-post', className: 'font-medium' },
          { header: 'Roller' },
          { header: 'Handlinger', className: 'text-right' },
        ]}
        renderRow={(user) => (
          <TableRow>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <span>{user.email}</span>
                {!user.userId && (
                  <span className="border border-border bg-muted px-2.5 py-0.5 text-[0.7rem] font-medium rounded-none">
                    Invitert
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>{formatRoles(user.roles)}</TableCell>
            <TableCell className="text-right">
              {user.userId ? (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
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
              ) : (
                <span className="text-xs text-muted-foreground">Venter på aksept</span>
              )}
            </TableCell>
          </TableRow>
        )}
      />

      {editingEmployee && (
        <FormDialog<EditFormData>
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Rediger Ansatt"
          formData={editingEmployee}
          onFieldChange={handleFieldChange}
          onSubmit={handleEditSubmit}
          fields={[
            {
              name: 'email',
              label: 'E-post',
              type: 'text',
              disabled: true,
              render: ({ value }) => (
                <div className="rounded-md border px-3 py-2 bg-muted text-muted-foreground">{value}</div>
              ),
            },
            {
              name: 'roles',
              label: 'Roller',
              render: ({ value, onChange }) => (
                <div className="space-y-3">
                  {[
                    { value: 'ADMIN' as const, label: 'Admin' },
                    { value: 'EMPLOYEE' as const, label: 'Ansatt' },
                  ].map((role) => (
                    <div key={role.value} className="flex flex-row items-center space-x-3 space-y-0">
                      <Checkbox
                        checked={value?.includes(role.value)}
                        onCheckedChange={(checked) => {
                          const currentRoles = value || [];
                          const newRoles = checked
                            ? [...currentRoles, role.value]
                            : currentRoles.filter((r: CompanyRoles) => r !== role.value);
                          onChange(newRoles);
                        }}
                      />
                      <label className="text-sm font-normal cursor-pointer">{role.label}</label>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
          actions={[
            {
              label: 'Avbryt',
              variant: 'outline',
              onClick: () => {
                setIsEditDialogOpen(false);
                setEditingEmployee(null);
              },
            },
            {
              label: 'Lagre endringer',
              type: 'submit',
              variant: 'default',
              onClick: () => {},
            },
          ]}
        />
      )}

      <FormDialog<InviteFormData>
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        title="Inviter Medarbeider"
        formData={inviteData}
        onFieldChange={handleInviteFieldChange}
        onSubmit={handleInviteSubmit}
        fields={[
          {
            name: 'email',
            label: 'E-postadresse',
            type: 'email',
            placeholder: 'fornavn@firma.no',
            required: true,
          },
          {
            name: 'roles',
            label: 'Velg roller',
            render: ({ value, onChange }) => (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Velg én eller flere roller for den ansatte</p>
                {[
                  { value: 'ADMIN' as const, label: 'Admin' },
                  { value: 'EMPLOYEE' as const, label: 'Ansatt' },
                ].map((role) => (
                  <div key={role.value} className="flex flex-row items-center space-x-3 space-y-0">
                    <Checkbox
                      checked={value?.includes(role.value)}
                      onCheckedChange={(checked) => {
                        const currentRoles = value || [];
                        const newRoles = checked
                          ? [...currentRoles, role.value]
                          : currentRoles.filter((r: CompanyRoles) => r !== role.value);
                        onChange(newRoles);
                      }}
                    />
                    <label className="text-sm font-normal cursor-pointer">{role.label}</label>
                  </div>
                ))}
              </div>
            ),
          },
        ]}
        actions={[
          {
            label: 'Avbryt',
            variant: 'outline',
            onClick: () => {
              setIsInviteDialogOpen(false);
              setInviteData({ email: '', roles: [] });
            },
          },
          {
            label: 'Send invitasjon',
            type: 'submit',
            variant: 'default',
            onClick: () => {},
          },
        ]}
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
