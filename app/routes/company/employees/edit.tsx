import React from 'react';
import {
  data,
  redirect,
  useFetcher,
  useLoaderData,
  useLocation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import type { CompanyUserDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import { createBaseClient, Roles, type EditCompanyUserDto } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { EditCompanyUserForm } from '~/components/forms/edit-company-user-form';
import type { EditCompanyUserSchema } from '~/features/company/admin/schemas/edit-company-user.schema';
import { ROUTES_MAP } from '~/lib/route-tree';
import { getUserSession } from '~/lib/auth.utils';

export type CompanyEmployeesEditLoaderData = {
  user: CompanyUserDto;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return redirect(ROUTES_MAP['company.employees.overview'].href);
  }

  try {
    const { user, accessToken: accesstoken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseApi = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });

    const response = await baseApi.AdminCompanyControllerService.AdminCompanyControllerService.getCompanyUser({
      companyId: user.company.companyId,
      userId: parseInt(userId),
    });

    if (!response.data) {
      return redirect(ROUTES_MAP['company.employees.overview'].href);
    }

    return data<CompanyEmployeesEditLoaderData>({
      user: response.data,
    });
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return redirect(ROUTES_MAP['company.employees.overview'].href);
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId');
    const rolesToUpdate = formData.get('roles');

    console.log(userId, rolesToUpdate);

    if (!userId || !rolesToUpdate) {
      return { error: 'Form data not provieded' };
    }

    const { user, accessToken: accesstoken } = await getUserSession(request);
    if (!user || !user.company) {
      return redirect('/');
    }

    const baseClient = createBaseClient({ baseUrl: ENV.BASE_SERVICE_BASE_URL, token: accesstoken });
    const payload: EditCompanyUserDto = {
      roles: rolesToUpdate.toString().split(',').flat() as Roles[],
    };

    await baseClient.AdminCompanyControllerService.AdminCompanyControllerService.editCompanyUser({
      companyId: user.company.companyId,
      userId: parseInt(userId.toString()),
      requestBody: payload,
    });

    return redirect('/company/employees/overview');
  } catch (error: any) {
    console.error(error);
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function CompanyEmployeesEdit() {
  const location = useLocation();
  const fetcher = useFetcher();
  const { user } = useLoaderData<CompanyEmployeesEditLoaderData>();

  const handleSubmit = React.useCallback(
    (values: EditCompanyUserSchema) => {
      const payload = new FormData();
      payload.set('userId', user.userId.toString());
      payload.set('roles', values.roles.toString());

      fetcher.submit(payload, {
        method: 'post',
        action: location.pathname,
      });
    },
    [fetcher],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rediger ansatt</h1>
          <p className="text-muted-foreground">Oppdater roller for ansatt</p>
        </div>

        <EditCompanyUserForm email={user.email} initialRoles={user.roles} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
