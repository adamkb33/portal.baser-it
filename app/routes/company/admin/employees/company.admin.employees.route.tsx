import { data, redirect, useLoaderData, useSubmit, type LoaderFunctionArgs } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CompanyUserDto, InviteTokenDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { CompanyRoles, createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { Button } from '~/components/ui/button';
import { getUserSession } from '~/lib/auth.utils';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Input } from '~/components/ui/input';
import { Pen } from 'lucide-react';
import { COMPANY_ROLE_LABELS } from '~/lib/constants';
import { PageHeader } from '../../_components/page-header';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Checkbox } from '~/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

type EditFormData = {
  userId: number;
  email: string;
  roles: Array<'ADMIN' | 'EMPLOYEE'>;
};

type InviteFormData = {
  email: string;
  roles: Array<'ADMIN' | 'EMPLOYEE'>;
};

export type EmployeesOverviewLoaderData = {
  users: CompanyUserDto[];
  invites: InviteTokenDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { user, accessToken } = await getUserSession(request);
    if (!user?.company) return redirect('/');

    const baseApi = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

    const [userResponse, inviteResponse] = await Promise.all([
      baseApi.AdminCompanyUserControllerService.AdminCompanyUserControllerService.getCompanyUsers({
        pageable: {},
        includeDeleted: false,
      }),
      baseApi.AdminCompanyUserControllerService.AdminCompanyUserControllerService.getInvitations(),
    ]);

    if (!userResponse.data) {
      return { error: 'Kunne ikke hente brukere for selskapet' };
    }

    return data<EmployeesOverviewLoaderData>({
      users: userResponse.data.content,
      invites: inviteResponse.data || [],
    });
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return { error: error.body.message };
    }
    throw error;
  }
}

const ROLE_OPTIONS = [
  { value: 'ADMIN' as const, label: 'Admin' },
  { value: 'EMPLOYEE' as const, label: 'Ansatt' },
];

const RoleCheckboxes = ({ value, onChange }: { value: CompanyRoles[]; onChange: (roles: CompanyRoles[]) => void }) => (
  <div className="space-y-3">
    {ROLE_OPTIONS.map((role) => (
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
);

export default function CompanyAdminEmployees() {
  const { users, invites } = useLoaderData<EmployeesOverviewLoaderData>();
  const submit = useSubmit();
  const [filter, setFilter] = useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EditFormData | null>(null);

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState<InviteFormData>({ email: '', roles: [] });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);

  const [isCancelInviteDialogOpen, setIsCancelInviteDialogOpen] = useState(false);
  const [cancelingInviteId, setCancelingInviteId] = useState<number | null>(null);

  const formatRoles = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => roles.map((role) => COMPANY_ROLE_LABELS[role]).join(', ');

  const submitToApi = (url: string, data: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    submit(formData, { method: 'post', action: url });
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    submitToApi(API_ROUTES_MAP['company.admin.employees.edit'].url, {
      userId: editingEmployee.userId.toString(),
      roles: editingEmployee.roles.join(','),
    });

    setIsEditDialogOpen(false);
    setEditingEmployee(null);
    toast.success('Ansattinformasjon oppdatert');
  };

  // Invite handlers
  const openInviteDialog = () => {
    setInviteData({ email: '', roles: [] });
    setIsInviteDialogOpen(true);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submitToApi(API_ROUTES_MAP['company.admin.employees.invite'].url, {
      email: inviteData.email,
      roles: JSON.stringify(inviteData.roles),
    });

    setIsInviteDialogOpen(false);
    setInviteData({ email: '', roles: [] });
    toast.success('Invitasjon sendt');
  };

  // Delete handlers
  const openDeleteDialog = (userId: number) => {
    setDeletingEmployeeId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingEmployeeId) return;

    submitToApi(API_ROUTES_MAP['company.admin.employees.delete'].url, {
      userId: deletingEmployeeId.toString(),
    });

    setIsDeleteDialogOpen(false);
    setDeletingEmployeeId(null);
    toast.success('Ansatt fjernet');
  };

  // Cancel invite handlers
  const openCancelInviteDialog = (inviteId: number) => {
    setCancelingInviteId(inviteId);
    setIsCancelInviteDialogOpen(true);
  };

  const handleCancelInviteConfirm = () => {
    if (!cancelingInviteId) return;

    submitToApi(API_ROUTES_MAP['company.admin.employees.cancel-invite'].url, {
      id: cancelingInviteId.toString(),
    });

    setIsCancelInviteDialogOpen(false);
    setCancelingInviteId(null);
    toast.success('Invitasjon trukket tilbake');
  };

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

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Ansatte</TabsTrigger>
          <TabsTrigger value="invited">Inviterte</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
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
                </TableCell>
              </TableRow>
            )}
          />
        </TabsContent>

        <TabsContent value="invited">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-post</TableHead>
                <TableHead>Roller</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Ingen aktive invitasjoner
                  </TableCell>
                </TableRow>
              ) : (
                invites.map((invite) => (
                  <TableRow key={invite.email}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{invite.email}</span>
                        <span className="border border-border bg-muted px-2.5 py-0.5 text-[0.7rem] font-medium rounded-none">
                          Venter
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatRoles(invite.payload.companyRoles)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => openCancelInviteDialog(invite.id)}
                      >
                        Trekk tilbake
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {editingEmployee && (
        <FormDialog<EditFormData>
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Rediger Ansatt"
          formData={editingEmployee}
          onFieldChange={(name, value) => setEditingEmployee({ ...editingEmployee, [name]: value })}
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
              render: ({ value, onChange }) => <RoleCheckboxes value={value} onChange={onChange} />,
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
        onFieldChange={(name, value) => setInviteData({ ...inviteData, [name]: value })}
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
              <>
                <p className="text-xs text-muted-foreground mb-3">Velg én eller flere roller for den ansatte</p>
                <RoleCheckboxes value={value} onChange={onChange} />
              </>
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
        open={isCancelInviteDialogOpen}
        onOpenChange={setIsCancelInviteDialogOpen}
        onConfirm={handleCancelInviteConfirm}
        title="Trekk tilbake invitasjon?"
        description="Er du sikker på at du vil trekke tilbake denne invitasjonen? Denne handlingen kan ikke angres."
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
