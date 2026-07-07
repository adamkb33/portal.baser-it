import { data, NavLink } from 'react-router';
import type { Route } from './+types/system-admin.companies.products.delete.route';
import { Base } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, Checkbox, CompanyPageTemplate, FormField, Notice, Panel, Text } from '~/ui';

const PRODUCT_VALUES = ['BOOKING', 'EVENT', 'OFFER', 'TIMESHEET'] as const;

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const companyId = Number(formData.get('companyId'));
  const products = PRODUCT_VALUES.filter((product) => formData.get(product) === 'on');

  if (!Number.isFinite(companyId) || products.length === 0) {
    const message = 'Selskap-ID og minst ett produkt er påkrevd.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data(
      { error: message, values: { companyId: Number.isFinite(companyId) ? String(companyId) : '', products } },
      { status: 400, headers: { 'Set-Cookie': flashCookie } },
    );
  }

  try {
    await withAuth(request, async () =>
      Base.deleteProductsFromCompany({
        body: {
          companyId,
          products: [...products],
        },
      }),
    );

    const flashCookie = await setFlashMessage(request, { type: 'success', text: 'Produkter fjernet.' });
    return data({ error: null, values: { companyId: '', products: [] } }, { headers: { 'Set-Cookie': flashCookie } });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke fjerne produkter.');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data(
      { error: message, values: { companyId: String(companyId), products } },
      { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } },
    );
  }
}

export default function SystemAdminCompaniesProductsDeletePage({ actionData }: Route.ComponentProps) {
  const values = actionData?.values ?? { companyId: '', products: [] as string[] };

  return (
    <CompanyPageTemplate
      title="Fjern produkter"
      description="Deaktiver produkter for selskap via system-admin endpoint."
      routeLinks={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <NavLink to={ROUTES_MAP['system-admin.companies.products'].href}>Tilbake til produkter</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to={ROUTES_MAP['system-admin.companies'].href}>Tilbake til selskaper</NavLink>
          </Button>
        </div>
      }
    >
      {actionData?.error ? <Notice tone="emphasis" title="Kunne ikke fjerne produkter" message={actionData.error} /> : null}
      <Panel title="Fjern produkter" description="Velg produktene som skal deaktiveres for selskapet.">
        <form method="post" className="space-y-4">
          <FormField label="Selskap-ID" name="companyId" type="number" defaultValue={values.companyId} required />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-text-primary">Produkter</legend>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Valgte produkter fjernes fra selskapet når skjemaet sendes inn.
            </Text>
            {PRODUCT_VALUES.map((product) => (
              <label key={product} className="flex min-h-10 items-center gap-2 text-sm text-text-primary">
                <Checkbox name={product} defaultChecked={values.products.includes(product)} />
                {product}
              </label>
            ))}
          </fieldset>
          <Button type="submit" variant="destructive">
            Fjern produkter
          </Button>
        </form>
      </Panel>
    </CompanyPageTemplate>
  );
}
