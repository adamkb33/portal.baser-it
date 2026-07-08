import { Form, useNavigate, useNavigation } from 'react-router';
import { Button, CompanyFormPageTemplate, FormField } from '~/ui';
import { ROUTES_MAP } from '~/lib/routing/route-tree';

export type ServiceGroupFormValues = {
  id?: number;
  name: string;
};

type ServiceGroupFormPageProps = {
  mode: 'create' | 'edit';
  values: ServiceGroupFormValues;
  actionData?: {
    error?: string;
    values?: ServiceGroupFormValues;
  } | null;
};

export function ServiceGroupFormPage({ mode, values, actionData }: ServiceGroupFormPageProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isEdit = mode === 'edit';
  const currentValues = actionData?.values ?? values;

  return (
    <CompanyFormPageTemplate
      title={isEdit ? 'Rediger tjenestegruppe' : 'Ny tjenestegruppe'}
      description="Bruk samme kompakte route-skall for bookingadministrasjon i stedet for et dialogskjema."
      backLink={{ to: ROUTES_MAP['company.booking.admin.service-groups'].href, label: 'Tilbake til tjenestegrupper' }}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES_MAP['company.booking.admin.service-groups'].href)}
          >
            Avbryt
          </Button>
          <Button type="submit" form="service-group-form" loading={isSubmitting}>
            {isEdit ? 'Lagre endringer' : 'Opprett tjenestegruppe'}
          </Button>
        </>
      }
    >
      <Form id="service-group-form" method="post" className="space-y-3">
        {currentValues.id ? <input type="hidden" name="id" value={currentValues.id} /> : null}
        <FormField
          label="Navn"
          name="name"
          defaultValue={currentValues.name}
          helperText="Dette navnet brukes for å organisere og filtrere tjenester i bookingadministrasjonen."
          placeholder="Skriv inn navn"
        />
      </Form>
    </CompanyFormPageTemplate>
  );
}
