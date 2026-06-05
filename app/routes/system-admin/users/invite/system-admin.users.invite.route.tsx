import { data } from 'react-router';
import type { Route } from './+types/system-admin.users.invite.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, FormField, Notice } from '~/ui';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    const message = 'E-post er påkrevd.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { email } }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () =>
      Base.inviteUser({
        body: {
          email,
          userRoles: ['SYSTEM_ADMIN'],
          companyRoles: [],
        },
      }),
    );

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Brukerinvitasjon sendt.' });
    return data({ error: null, values: { email: '' } }, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke invitere bruker.');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { email } }, { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function SystemAdminUsersInvitePage({ actionData }: Route.ComponentProps) {
  const values = actionData?.values ?? { email: '' };

  return (
    <CompanyPageTemplate
      title="Inviter systemadmin"
      description="Opprett systemadmin-invitasjon via base-service/system-admin/users."
      routeLinks={
        <a href={ROUTES_MAP['system-admin.users'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til brukere
        </a>
      }
    >
      {actionData?.error ? <Notice tone="emphasis" title="Kunne ikke invitere bruker" message={actionData.error} /> : null}
      <form method="post" className="space-y-3 rounded-md border border-border bg-surface p-4">
        <FormField label="E-post" name="email" defaultValue={values.email} required type="email" />
        <div>
          <Button type="submit">Send invitasjon</Button>
        </div>
      </form>
    </CompanyPageTemplate>
  );
}
