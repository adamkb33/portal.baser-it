import { data, redirect, useFetcher, Link } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.contact.route';
import { CheckCircle2, Edit3 } from 'lucide-react';
import type { ContactDto } from '~/api/generated/identity';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { SubmitContactForm } from '~/routes/booking/public/appointment/session/contact/_forms/submit-contact.form';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { PublicCompanyContactController } from '~/api/generated/identity';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import {
  BookingContainer,
  BookingSection,
  BookingButton,
  BookingMeta,
  BookingErrorBanner,
  BookingStepHeader,
  BookingSummary,
} from '../../_components/booking-layout';
import type { SubmitContactFormSchema } from './_schemas/submit-contact.form.schema';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  console.debug('[booking.contact.loader] start', {
    method: request.method,
    url: request.url,
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
  });
  try {
    const session = await getSession(request);

    if (!session) {
      console.error('[booking.contact.loader] missing session');
      return redirect('/appointments');
    }

    let existingContact: ContactDto | undefined = undefined;

    if (session.contactId) {
      console.debug('[booking.contact.loader] fetching contact', {
        companyId: session.companyId,
        contactId: session.contactId,
      });
      const contactResponse = await PublicCompanyContactController.getContact({
        path: {
          companyId: session.companyId,
          contactId: session.contactId,
        },
      });

      existingContact = contactResponse.data?.data;
    }

    console.debug('[booking.contact.loader] loaded', {
      sessionId: session.sessionId,
      companyId: session.companyId,
      hasContactId: !!session.contactId,
      hasExistingContact: !!existingContact,
    });
    return data({
      session,
      existingContact: existingContact ?? null,
      error: null as string | null,
    });
  } catch (error) {
    console.error('[booking.contact.loader] failed', error);
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente kontaktinformasjon');
    return data(
      {
        session: null,
        existingContact: null,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    const formData = await request.formData();

    const contactResponse = await PublicCompanyContactController.publicGetCreateOrUpdateContact({
      body: {
        ...(formData.get('id') ? { id: Number(formData.get('id')) } : {}),
        companyId: Number(formData.get('companyId')),
        givenName: String(formData.get('givenName') ?? ''),
        familyName: String(formData.get('familyName') ?? ''),
        email: formData.get('email') ? String(formData.get('email')) : undefined,
        mobileNumber: formData.get('mobileNumber') ? String(formData.get('mobileNumber')) : undefined,
      },
    });
    if (!contactResponse.data?.data) {
      const message = contactResponse.data?.message || 'En feil har skjedd med lagring av kontakt';
      return data(
        {
          error: message,
        },
        { status: 400 },
      );
    }

    await PublicAppointmentSessionController.submitAppointmentSessionContact({
      query: {
        sessionId: session.sessionId,
        contactId: contactResponse.data.data.id,
      },
    });

    return redirect(ROUTES_MAP['booking.public.appointment.session.employee'].href);
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke lagre kontakt');
    return data(
      {
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function AppointmentsContactForm({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher({ key: 'appointment-contact-form-fetcher' });
  const session = loaderData.session ?? null;
  const existingContact = loaderData.existingContact ?? null;
  const formId = 'booking-contact-form';

  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const actionError = fetcher.data?.error;
  const loaderError = loaderData.error ?? undefined;
  const error = loaderError || actionError;

  if (loaderError || !session) {
    return (
      <BookingContainer>
        <BookingSection label="Kontaktinformasjon" title="Hvem skal vi registrere avtalen på?">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {loaderError ?? 'Ugyldig økt'}
          </div>
        </BookingSection>
      </BookingContainer>
    );
  }

  const normalizeMobileNumber = (value?: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (trimmed.startsWith('+47')) return trimmed.slice(3).trim();
    if (trimmed.startsWith('47') && trimmed.length > 2) return trimmed.slice(2).trim();
    return trimmed;
  };

  const initialValues = existingContact
    ? {
        id: existingContact.id,
        companyId: session.companyId,
        givenName: existingContact.givenName,
        familyName: existingContact.familyName,
        email: existingContact.email?.value ?? '',
        mobileNumber: normalizeMobileNumber(existingContact.mobileNumber?.value),
      }
    : undefined;

  const handleSubmit = (values: SubmitContactFormSchema) => {
    const formData = new FormData();
    if (values.id) formData.set('id', String(values.id));
    formData.set('companyId', String(values.companyId));
    formData.set('givenName', values.givenName);
    formData.set('familyName', values.familyName);
    if (values.email) formData.set('email', values.email);
    if (values.mobileNumber) formData.set('mobileNumber', values.mobileNumber);

    fetcher.submit(formData, {
      method: 'post',
    });
  };

  return (
    <>
      <BookingContainer>
        {error && <BookingErrorBanner message={error} sticky />}

        <BookingStepHeader
          label="Kontaktinformasjon"
          title="Hvem skal vi registrere avtalen på?"
          className="mb-4 md:mb-6"
        />

        <BookingSection className="space-y-4 md:space-y-6">
        {/* ========================================
            EXISTING CONTACT - Compact card on mobile
            ======================================== */}
        {existingContact && (
          <div className="space-y-3 md:space-y-4">
            {/* Visual separator with label */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-secondary md:size-5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-sm">
                Eksisterende kontakt
              </span>
            </div>

            {/* Existing contact - Ultra-compact card */}
            <div className="rounded-lg border border-card-border bg-card-muted-bg p-3 md:p-4">
              {/* Contact details - Inline labels on mobile, stacked on desktop */}
              <BookingMeta
                layout="compact"
                className="space-y-2 md:space-y-2.5"
                items={[
                  {
                    label: 'Navn',
                    value: `${existingContact.givenName} ${existingContact.familyName}`,
                  },
                  ...(existingContact.email?.value
                    ? [{ label: 'E-post', value: existingContact.email.value }]
                    : []),
                  ...(existingContact.mobileNumber?.value
                    ? [{ label: 'Mobil', value: existingContact.mobileNumber.value }]
                    : []),
                ]}
              />

              {/* Edit hint - Minimal */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Edit3 className="size-3 shrink-0" />
                <p>Kan oppdateres under</p>
              </div>
            </div>

            {/* Visual divider */}
            <div className="relative py-3 md:py-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:text-sm">
                  {existingContact ? 'Oppdater informasjon' : 'Fyll ut informasjon'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            CONTACT FORM
            ======================================== */}
        <SubmitContactForm
          companyId={session.companyId}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          formId={formId}
        />
        </BookingSection>
      </BookingContainer>

      <BookingSummary
        mobile={{
          items: [
            { label: 'Steg', value: 'Kontaktinformasjon' },
          ],
          primaryAction: (
            <BookingButton
              type="submit"
              form={formId}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Fortsett
            </BookingButton>
          ),
          secondaryAction: (
            <Link to={ROUTES_MAP['booking.public.appointment'].href}>
              <BookingButton type="button" variant="outline" size="md" fullWidth>
                Tilbake
              </BookingButton>
            </Link>
          ),
        }}
      />
    </>
  );
}
