// routes/company/admin/employees/company.admin.employees.route.tsx
import { redirect } from 'react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import type { Route } from './+types/company.admin.employees.route';
import { getFlashMessage } from '../../_lib/flash-message.server';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { user, accessToken } = await getUserSession(request);
    if (!user?.company) return redirect('/');

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '10');

    const baseApi = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accessToken });

    const [userResponse, inviteResponse, { message }] = await Promise.all([
      baseApi.AdminCompanyUserControllerService.AdminCompanyUserControllerService.getCompanyUsers({
        page,
        size,
        includeDeleted: false,
      }),
      baseApi.AdminCompanyUserControllerService.AdminCompanyUserControllerService.getInvitations(),
      getFlashMessage(request),
    ]);

    if (!userResponse.data) {
      return { error: 'Kunne ikke hente brukere for selskapet' };
    }

    console.log(userResponse.data.content);

    return {
      users: userResponse.data.content,
      pagination: {
        page: userResponse.data.page,
        size: userResponse.data.size,
        totalElements: userResponse.data.totalElements,
        totalPages: userResponse.data.totalPages,
      },
      invites: inviteResponse.data || [],
      flashMessage: message,
    };
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return { error: error.body.message };
    }
    throw error;
  }
}

export default function CompanyAdminEmployees({ loaderData }: Route.ComponentProps) {
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if ('flashMessage' in loaderData && loaderData.flashMessage) {
      const { type, text } = loaderData.flashMessage;

      switch (type) {
        case 'success':
          toast.success(text);
          break;
        case 'error':
          toast.error(text);
          break;
        case 'info':
          toast.info(text);
          break;
        case 'warning':
          toast.warning(text);
          break;
      }
    }
  }, [loaderData]);

  if ('error' in loaderData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-500">{loaderData.error}</p>
      </div>
    );
  }

  const { users, pagination, invites } = loaderData;

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
          <EmployeesTable users={users} pagination={pagination} />
        </TabsContent>

        <TabsContent value="invited">
          <InvitesTable invites={invites} />
        </TabsContent>
      </Tabs>
    </>
  );
}
