// routes/company/admin/employees/company.admin.employees.route.tsx (cleaned up)
import { data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { useState } from 'react';
import type { CompanyUserDto, InviteTokenDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { Button } from '~/components/ui/button';
import { getUserSession } from '~/lib/auth.utils';
import { Input } from '~/components/ui/input';
import { PageHeader } from '../../_components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { InviteEmployeeForm } from './forms/invite-employee.form-dialog';
import { EmployeesTable } from './tables/employees.table';
import { InvitesTable } from './tables/invites.table';

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

export default function CompanyAdminEmployees() {
  const { users, invites } = useLoaderData<EmployeesOverviewLoaderData>();
  const [filter, setFilter] = useState('');

  return (
    <>
      <PageHeader
        title="Ansatte"
        description="Oversikt over alle brukere tilknyttet selskapet. Administrer roller, tilganger og inviter nye medlemmer."
        actions={<InviteEmployeeForm trigger={<Button>Inviter ansatt</Button>} />}
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
          <EmployeesTable users={users} />
        </TabsContent>

        <TabsContent value="invited">
          <InvitesTable invites={invites} />
        </TabsContent>
      </Tabs>
    </>
  );
}
