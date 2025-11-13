import { data, Link, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { useMemo, useState } from 'react';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { Button } from '~/components/ui/button';
import { getUserSession } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { TableCell, TableRow } from '~/components/ui/table';
import { Input } from '~/components/ui/input';
import { Pen } from 'lucide-react';

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

    const response = await baseApi.AdminCompanyControllerService.AdminCompanyControllerService.getCompanyUsers({
      companyId: user.company.companyId,
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

export default function CompanyEmployees() {
  const { users } = useLoaderData<EmployeesOverviewLoaderData>();
  const [filter, setFilter] = useState('');

  const formatRoles = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => {
    return roles.map((role) => (role === 'ADMIN' ? 'Admin' : 'Ansatt')).join(', ');
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
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ansatte</h1>
          <p className="text-sm text-muted-foreground">Oversikt over alle brukere tilknyttet selskapet.</p>
        </div>
        <Button asChild>
          <Link to={ROUTES_MAP['company.employees.invite'].href}>Inviter ansatt</Link>
        </Button>
      </div>

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
        getRowKey={(user) => user.userId}
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
              <Button variant="outline" size="sm" asChild>
                <Link to={`${ROUTES_MAP['company.employees.edit'].href}?userId=${user.userId}`}>
                  <Pen className="h-4 w-4" />
                  <span className="sr-only">Rediger</span>
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  );
}
