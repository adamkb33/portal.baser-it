import { data, Form, useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from 'react-router';
import { createBaseClient, type CompanySummaryDto } from '~/api/clients/base';
import { type ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { CompanyContextSummaryCard } from '~/routes/user/company-context/_components/company-context-summary-card';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { getAccessToken } from '~/lib/auth.utils';

export type LoaderResponse = {
  companyContexts?: CompanySummaryDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);

  const baseApi = createBaseClient({
    baseUrl: ENV.BASE_SERVICE_BASE_URL,
    token: accessToken,
  });

  try {
    const response = await baseApi.AuthControllerService.AuthControllerService.getCompanyContexts();
    console.log(response);

    return data<LoaderResponse>({
      companyContexts: response.data,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const companyId = formData.get('companyId');
  const orgNumber = formData.get('orgNumber');

  if (!orgNumber || !companyId) {
    return { error: 'Ikke valgt' };
  }

  const accessToken = await getAccessToken(request);

  const baseClient = createBaseClient({
    baseUrl: ENV.BASE_SERVICE_BASE_URL,
    token: accessToken,
  });

  try {
    const response = await baseClient.AuthControllerService.AuthControllerService.companySignIn({
      requestBody: {
        companyId: parseInt(companyId.toString()),
      },
    });

    const payload = response.data;
    if (!payload) {
      return { error: 'En feil har skjedd ved innlogging til selskap' };
    }

    const accessCookie = await accessTokenCookie.serialize(payload.accessToken, {
      expires: new Date(payload.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(payload.refreshToken, {
      expires: new Date(payload.refreshTokenExpiresAt * 1000),
    });

    console.log(payload);

    return redirect('/', {
      headers: [
        ['Set-Cookie', accessCookie],
        ['Set-Cookie', refreshCookie],
      ],
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function CompanyContextPage() {
  const loaderData = useLoaderData<LoaderResponse>();
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
