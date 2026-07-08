import { Form, useNavigate, useNavigation } from 'react-router';
import { CompanyFormPageTemplate, FormField, Button } from '~/ui';
import type { ContactFormData, FieldErrors } from '../_schemas/contact.form.schema';
import { ROUTES_MAP } from '~/lib/routing/route-tree';

type ContactFormPageProps = {
  mode: 'create' | 'edit';
  values: ContactFormData;
  actionData?: {
    error?: string;
    fieldErrors?: FieldErrors;
    values?: ContactFormData;
  } | null;
  returnTo?: string | null;
};

export function ContactFormPage({ mode, values, actionData, returnTo }: ContactFormPageProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isEdit = mode === 'edit';
  const currentValues = actionData?.values ?? values;
  const fieldErrors = actionData?.fieldErrors ?? {};
  const backHref = returnTo || ROUTES_MAP['company.admin.contacts'].href;

  return (
    <CompanyFormPageTemplate
      title={isEdit ? 'Rediger kontakt' : 'Ny kontakt'}
      description="Bruk en egen ruteside for kontaktdata i stedet for modal. Hold skjemaet kompakt og konsistent med resten av selskapssonen."
      backLink={{ to: backHref, label: 'Tilbake til kontakter' }}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
            Avbryt
          </Button>
          <Button type="submit" form="contact-form" loading={isSubmitting}>
            {isEdit ? 'Lagre endringer' : 'Opprett kontakt'}
          </Button>
        </>
      }
    >
      <Form id="contact-form" method="post" className="space-y-3">
        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
        {currentValues.id ? <input type="hidden" name="id" value={currentValues.id} /> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            label="Fornavn"
            name="givenName"
            defaultValue={currentValues.givenName}
            error={fieldErrors.givenName}
            helperText="Navnet kunden møter i tabeller og bookingflater."
            placeholder="Skriv inn fornavn"
            autoComplete="given-name"
          />
          <FormField
            label="Etternavn"
            name="familyName"
            defaultValue={currentValues.familyName}
            error={fieldErrors.familyName}
            helperText="Bruk fullt navn for tydelig søk og oversikt."
            placeholder="Skriv inn etternavn"
            autoComplete="family-name"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField
            label="E-post"
            name="email"
            type="email"
            defaultValue={currentValues.email ?? ''}
            error={fieldErrors.email}
            helperText="Valgfritt, men anbefalt for oppfølging og booking."
            placeholder="fornavn@firma.no"
            autoComplete="email"
          />
          <FormField
            label="Mobil"
            name="mobileNumber"
            type="tel"
            defaultValue={currentValues.mobileNumber ?? ''}
            error={fieldErrors.mobileNumber}
            helperText="Bruk fullt nummer, gjerne med landskode."
            placeholder="+47 412 34 567"
            autoComplete="tel"
          />
        </div>
      </Form>
    </CompanyFormPageTemplate>
  );
}
