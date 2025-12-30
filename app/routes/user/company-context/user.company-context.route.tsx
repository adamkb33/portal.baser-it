import { data, Form, redirect } from 'react-router';
import { CompanyContextSummaryCard } from '~/routes/user/company-context/_components/company-context-summary-card';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { AuthController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/user.company-context.route';

export async function loader({ request }: Route.LoaderArgs) {
  return withAuth(request, async () => {
    try {
      const response = await AuthController.getCompanyContexts();

      return data({
        companyContexts: response.data?.data,
      });
    } catch (error: any) {
      console.error('[company-context] Loader error:', error);
      return data({ companyContexts: [] });
    }
  });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const companyId = formData.get('companyId');
  const orgNumber = formData.get('orgNumber');

  if (!orgNumber || !companyId) {
    return data({ error: 'Ikke valgt' }, { status: 400 });
  }

  return withAuth(request, async () => {
    try {
      const response = await AuthController.companySignIn({
        body: {
          companyId: parseInt(companyId.toString()),
        },
      });

      const payload = response.data?.data;

      if (!payload) {
        return data({ error: 'En feil har skjedd ved innlogging til selskap' }, { status: 400 });
      }

      const accessCookie = await accessTokenCookie.serialize(payload.accessToken, {
        expires: new Date(payload.accessTokenExpiresAt * 1000),
      });
      const refreshCookie = await refreshTokenCookie.serialize(payload.refreshToken, {
        expires: new Date(payload.refreshTokenExpiresAt * 1000),
      });

      return redirect('/', {
        headers: [
          ['Set-Cookie', accessCookie],
          ['Set-Cookie', refreshCookie],
        ],
      });
    } catch (error: any) {
      console.error('[company-context] Action error:', error);
      return data(
        { error: error?.response?.data?.message || 'Noe gikk galt. Prøv igjen.' },
        { status: error?.response?.status || 400 },
      );
    }
  });
}

export default function CompanyContextPage({ loaderData }: Route.ComponentProps) {
  const companies = loaderData?.companyContexts || [];

  if (!companies.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">No companies found</p>
        <p className="text-sm">You might not have access to any company contexts yet.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center justify-center">
      {companies.map((company) => (
        <Form key={company.id} method="post">
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="orgNumber" value={company.orgNumber} />
          <CompanyContextSummaryCard company={company} />
        </Form>
      ))}
    </div>
  );
}
