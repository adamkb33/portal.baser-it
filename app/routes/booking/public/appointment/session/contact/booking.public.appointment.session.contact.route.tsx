import {
  data,
  redirect,
  useLoaderData,
  useFetcher,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import { CheckCircle2, Edit3, AlertCircle } from 'lucide-react';
import type { ContactDto } from '~/api/generated/identity';
import type { AppointmentSessionDto } from '~/api/generated/booking';
import { SubmitContactForm } from '~/routes/booking/public/appointment/session/contact/_forms/submit-contact.form';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { PublicCompanyContactController } from '~/api/generated/identity';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { BookingContainer, BookingSection, BookingMeta } from '../../_components/booking-layout';
import type { SubmitContactFormSchema } from './_schemas/submit-contact.form.schema';
import { handleRouteError, type RouteData } from '~/lib/api-error';

export type AppointmentsContactFormLoaderData = RouteData<{
  session: AppointmentSessionDto;
  existingContact?: ContactDto;
}>;

export async function loader(args: LoaderFunctionArgs) {
  try {
    const session = await getSession(args.request);

    if (!session) {
      return redirect('/appointments');
    }

    let existingContact: ContactDto | undefined = undefined;

    if (session.contactId) {
      const contactResponse = await PublicCompanyContactController.getContact({
        path: {
          companyId: session.companyId,
          contactId: session.contactId,
        },
      });

      existingContact = contactResponse.data?.data;
    }

    return data<AppointmentsContactFormLoaderData>({ ok: true, session, existingContact });
  } catch (error: any) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke hente kontaktinformasjon' });
  }
}

export async function action(args: ActionFunctionArgs) {
  try {
    const session = await getSession(args.request);

    if (!session) {
      return redirect('/appointments');
    }

    const formData = await args.request.formData();

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
      return data<RouteData<Record<string, never>>>(
        { ok: false, error: { message: 'En feil har skjedd med lagring av kontakt' } },
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
  } catch (error: any) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke lagre kontakt' });
  }
}

export default function AppointmentsContactForm() {
  const loaderData = useLoaderData<AppointmentsContactFormLoaderData>();
  const fetcher = useFetcher({ key: 'appointment-contact-form-fetcher' });
  const session = loaderData.ok ? loaderData.session : undefined;
  const existingContact = loaderData.ok ? loaderData.existingContact : undefined;

  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const actionError = fetcher.data && 'ok' in fetcher.data ? (fetcher.data.ok ? undefined : fetcher.data.error.message) : fetcher.data?.error;
  const loaderError = loaderData.ok ? undefined : loaderData.error.message;
  const error = loaderError || actionError;

  if (!loaderData.ok || !session) {
    return (
      <BookingContainer>
        <BookingSection label="Kontaktinformasjon" title="Hvem skal vi registrere avtalen på?">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {loaderData.ok ? 'Ugyldig økt' : loaderData.error.message}
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
    <BookingContainer>
      {/* ========================================
          ERROR BANNER - Sticky on mobile for visibility
          ======================================== */}
      {error && (
        <div className="sticky top-0 z-10 border-b border-destructive/20 bg-destructive/10 md:relative md:rounded-lg md:border">
          <div className="flex items-start gap-3 p-3 md:p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive md:text-base">Noe gikk galt</p>
              <p className="mt-1 text-xs text-destructive/90 md:text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          PAGE HEADER - Mobile-optimized typography
          ======================================== */}
      <BookingSection
        label="Kontaktinformasjon"
        title="Hvem skal vi registrere avtalen på?"
        className="space-y-4 md:space-y-6"
      >
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
              <dl className="space-y-2 md:space-y-2.5 flex gap-6">
                {/* Name */}
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">Navn:</dt>
                  <dd className="text-sm font-semibold text-card-text md:text-base">
                    {existingContact.givenName} {existingContact.familyName}
                  </dd>
                </div>

                {/* Email */}
                {existingContact.email?.value && (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">E-post:</dt>
                    <dd className="text-sm text-card-text md:text-base">{existingContact.email.value}</dd>
                  </div>
                )}

                {/* Mobile */}
                {existingContact.mobileNumber?.value && (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">Mobil:</dt>
                    <dd className="text-sm text-card-text md:text-base">{existingContact.mobileNumber.value}</dd>
                  </div>
                )}
              </dl>

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
        />
      </BookingSection>
    </BookingContainer>
  );
}
