import { data } from 'react-router';
import type { Route } from './+types/system-admin.companies.roles.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, FormField, Notice } from '~/ui';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userId = Number(formData.get('userId'));
  const companyId = Number(formData.get('companyId'));
  const role = String(formData.get('role') ?? 'ADMIN');

  if (!Number.isFinite(userId) || !Number.isFinite(companyId)) {
    const message = 'Ugyldig bruker- eller selskap-ID.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { userId: '', companyId: '', role } }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () =>
      Base.addCompanyRole({
        body: {
          userId,
          companyRoles: [{ companyId, roles: [role as 'ADMIN' | 'EMPLOYEE'] }],
        },
      }),
    );

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Rolle tildelt.' });
    return data({ error: null, values: { userId: '', companyId: '', role: 'ADMIN' } }, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke tildele rolle.');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { userId: String(userId), companyId: String(companyId), role } }, { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function SystemAdminCompaniesRolesPage({ actionData }: Route.ComponentProps) {
  const values = actionData?.values ?? { userId: '', companyId: '', role: 'ADMIN' };

  return (
    <CompanyPageTemplate
      title="Tildel selskapsroller"
      description="Koble bruker til selskap med ADMIN eller EMPLOYEE."
      routeLinks={
        <a href={ROUTES_MAP['system-admin.companies'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til selskaper
        </a>
      }
    >
      {actionData?.error ? <Notice tone="emphasis" title="Kunne ikke tildele rolle" message={actionData.error} /> : null}
      <form method="post" className="space-y-3 rounded-md border border-border bg-surface p-4">
        <FormField label="Bruker-ID" name="userId" type="number" defaultValue={values.userId} required />
        <FormField label="Selskap-ID" name="companyId" type="number" defaultValue={values.companyId} required />
        <label className="block text-sm font-medium text-text-primary">
          Rolle
          <select name="role" defaultValue={values.role} className="mt-1 h-10 w-full rounded-sm border border-border bg-background px-2 text-sm">
            <option value="ADMIN">ADMIN</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </label>
        <div>
          <Button type="submit">Tildel rolle</Button>
        </div>
      </form>
    </CompanyPageTemplate>
  );
}
