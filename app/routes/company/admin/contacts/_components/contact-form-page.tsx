import { Form, useNavigate, useNavigation } from 'react-router';
import { CompanyFormPageTemplate, FormField, Text, Button } from '~/ui';
import type { ContactFormData, FieldErrors } from '../_schemas/contact.form.schema';
import { ROUTES_MAP } from '~/lib/route-tree';

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
          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Fornavn
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Navnet kunden møter i tabeller og bookingflater.
            </Text>
            <FormField
              name="givenName"
              defaultValue={currentValues.givenName}
              error={fieldErrors.givenName}
              placeholder="Skriv inn fornavn"
              autoComplete="given-name"
            />
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Etternavn
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Bruk fullt navn for tydelig søk og oversikt.
            </Text>
            <FormField
              name="familyName"
              defaultValue={currentValues.familyName}
              error={fieldErrors.familyName}
              placeholder="Skriv inn etternavn"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              E-post
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Valgfritt, men anbefalt for oppfølging og booking.
            </Text>
            <FormField
              name="email"
              type="email"
              defaultValue={currentValues.email ?? ''}
              error={fieldErrors.email}
              placeholder="fornavn@firma.no"
              autoComplete="email"
            />
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="label" className="text-text-primary">
              Mobil
            </Text>
            <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
              Bruk fullt nummer, gjerne med landskode.
            </Text>
            <FormField
              name="mobileNumber"
              type="tel"
              defaultValue={currentValues.mobileNumber ?? ''}
              error={fieldErrors.mobileNumber}
              placeholder="+47 412 34 567"
              autoComplete="tel"
            />
          </div>
        </div>
      </Form>
    </CompanyFormPageTemplate>
  );
}
