import { data, redirect } from 'react-router';
import type { Route } from './+types/company.admin.employees.invite.route';
import { CompanyRole } from '~/api/clients/types';
import { AdminCompanyController } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { EmployeeFormPage, type EmployeeFormValues } from '../_components/employee-form-page';

const emptyValues: EmployeeFormValues = {
  email: '',
  roles: [],
};

export async function loader() {
  return data({ values: emptyValues });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();
  const rolesRaw = String(formData.get('roles') ?? '[]');
  let roles: CompanyRole[] = [];

  try {
    roles = JSON.parse(rolesRaw) as CompanyRole[];
  } catch {
    roles = [];
  }

  const values: EmployeeFormValues = { email, roles };

  if (!email || roles.length === 0) {
    return data({ error: 'Fyll inn e-post og velg minst én rolle.', values }, { status: 400 });
  }

  try {
    await withAuth(request, async () => {
      await AdminCompanyController.inviteCompanyUser({
        body: {
          email,
          roles,
        },
      });
    });

    return redirect(ROUTES_MAP['company.admin.employees'].href);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke sende invitasjon');
    return data({ error: message, values }, { status: 400 });
  }
}

export default function CompanyAdminEmployeesInvitePage({ loaderData, actionData }: Route.ComponentProps) {
  return <EmployeeFormPage mode="invite" values={loaderData.values} actionData={actionData} />;
}
