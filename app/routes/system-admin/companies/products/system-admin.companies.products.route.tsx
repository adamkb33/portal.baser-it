import { data } from 'react-router';
import type { Route } from './+types/system-admin.companies.products.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Button, CompanyPageTemplate, FormField, Notice } from '~/ui';

const PRODUCT_VALUES = ['BOOKING', 'EVENT', 'TIMESHEET'] as const;

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const companyId = Number(formData.get('companyId'));
  const products = PRODUCT_VALUES.filter((product) => formData.get(product) === 'on');

  if (!Number.isFinite(companyId) || products.length === 0) {
    const message = 'Selskap-ID og minst ett produkt er påkrevd.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { companyId: '', products } }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    await withAuth(request, async () =>
      Base.addProductsToCompany({
        body: {
          companyId,
          products: [...products],
        },
      }),
    );

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Produkter oppdatert.' });
    return data({ error: null, values: { companyId: '', products: [] } }, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke oppdatere produkter.');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message, values: { companyId: String(companyId), products } }, { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function SystemAdminCompaniesProductsPage({ actionData }: Route.ComponentProps) {
  const values = actionData?.values ?? { companyId: '', products: [] as string[] };

  return (
    <CompanyPageTemplate
      title="Tildel produkter"
      description="Aktiver produkter for selskap via system-admin endpoint."
      routeLinks={
        <a href={ROUTES_MAP['system-admin.companies'].href} className="inline-flex rounded-sm border border-border px-3 py-2 text-sm">
          Tilbake til selskaper
        </a>
      }
    >
      {actionData?.error ? <Notice tone="emphasis" title="Kunne ikke oppdatere produkter" message={actionData.error} /> : null}
      <form method="post" className="space-y-3 rounded-md border border-border bg-surface p-4">
        <FormField label="Selskap-ID" name="companyId" type="number" defaultValue={values.companyId} required />
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">Produkter</p>
          {PRODUCT_VALUES.map((product) => (
            <label key={product} className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" name={product} defaultChecked={values.products.includes(product)} />
              {product}
            </label>
          ))}
        </div>
        <div>
          <Button type="submit">Oppdater produkter</Button>
        </div>
      </form>
    </CompanyPageTemplate>
  );
}
