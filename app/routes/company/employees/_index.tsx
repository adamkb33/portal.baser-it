import { data, Link, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { createBaseClient } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { getUserSession } from '~/lib/auth.utils';
import { Pen } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/route-tree';

export type EmployeesOverviewLoaderData = {
  users: CompanyUserDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { companyId, user, accesstoken } = await getUserSession(request);
    if (!user || !companyId) {
      return redirect('/');
    }

    const baseApi = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

    const response = await baseApi.AdminCompanyControllerService.AdminCompanyControllerService.getCompanyUsers({
      companyId,
    });
    if (!response.data) {
      return { error: 'Kunne ikke hente brukere for selskapet' };
    }

    return data<EmployeesOverviewLoaderData>({
      users: response.data,
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

  const formatRoles = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => {
    return roles.map((role) => (role === 'ADMIN' ? 'Admin' : 'Ansatt')).join(', ');
  };

  return (
    <div>
      <Table>
        <TableCaption>Oversikt over ansatte i selskapet.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>E-post</TableHead>
            <TableHead>Roller</TableHead>
            <TableHead className="text-right">Rediger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.email}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{formatRoles(user.roles)}</TableCell>
              <TableCell className="text-right">
                <Link
                  to={`${ROUTES_MAP['company.employees.overview.edit'].href}?userId=${user.userId}`}
                  className="flex justify-end gap-2"
                >
                  <Button variant="outline" size="sm">
                    <Pen />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
