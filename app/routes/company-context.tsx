import { data, Form, useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from 'react-router';
import { createBaseClient, type CompanySummaryDto } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { CompanyCard } from '~/components/cards/company-summary.card';
import { accessTokenCookie, companyContextCookie } from '~/features/auth/api/cookies.server';

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

  const response = await baseApi.AuthControllerService.AuthControllerService.getCompanyContexts();

  return data<LoaderResponse>({
    companyContexts: response.data,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const companyId = formData.get('companyId');

  const companyCookie = await companyContextCookie.serialize(companyId, {
    expires: new Date(Date.now() + 1209600 * 1000),
  });

  const headers = new Headers();
  headers.append('Set-Cookie', companyCookie);

  return redirect('/company', { headers });
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
          <CompanyCard company={company} />
        </Form>
      ))}
    </div>
  );
}
