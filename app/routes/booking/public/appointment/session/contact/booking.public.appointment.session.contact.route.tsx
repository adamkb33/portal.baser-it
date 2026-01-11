import {
  data,
  redirect,
  useLoaderData,
  useFetcher,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import { CheckCircle2, Edit3, AlertCircle } from 'lucide-react';
import type { ContactDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { SubmitContactForm } from '~/routes/booking/public/appointment/session/contact/_forms/submit-contact.form';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { baseApi, bookingApi } from '~/lib/utils';
import { BookingContainer, BookingSection, BookingMeta } from '../../_components/booking-layout';
import type { SubmitContactFormSchema } from './_schemas/submit-contact.form.schema';

export type AppointmentsContactFormLoaderData = {
  session: AppointmentSessionDto;
  existingContact?: ContactDto;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    let existingContact: ContactDto | undefined = undefined;

    if (session.contactId) {
      const contactResponse =
        await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.getContact({
          companyId: session.companyId,
          contactId: session.contactId,
        });

      existingContact = contactResponse.data;
    }

    return data<AppointmentsContactFormLoaderData>({ session, existingContact });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return { error: (error as ApiClientError).body.message };
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    const formData = await request.formData();

    const contactResponse =
      await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.publicGetCreateOrUpdateContact(
        {
          requestBody: {
            ...(formData.get('id') ? { id: Number(formData.get('id')) } : {}),
            companyId: Number(formData.get('companyId')),
            givenName: String(formData.get('givenName') ?? ''),
            familyName: String(formData.get('familyName') ?? ''),
            email: formData.get('email') ? String(formData.get('email')) : undefined,
            mobileNumber: formData.get('mobileNumber') ? String(formData.get('mobileNumber')) : undefined,
          },
        },
      );
    if (!contactResponse.data) {
      return { error: 'En feil har skjedd med lagring av kontakt' };
    }

    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.submitAppointmentSessionContact(
      {
        sessionId: session.sessionId,
        contactId: contactResponse.data.id,
      },
    );

    return redirect(ROUTES_MAP['booking.public.appointment.session.employee'].href);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AppointmentsContactForm() {
  const { session, existingContact, error: loaderError } = useLoaderData<AppointmentsContactFormLoaderData>();
  const fetcher = useFetcher({ key: 'appointment-contact-form-fetcher' });

  const initialValues = existingContact
    ? {
        id: existingContact.id,
        companyId: session.companyId,
        givenName: existingContact.givenName,
        familyName: existingContact.familyName,
        email: existingContact.email?.value ?? '',
        mobileNumber: existingContact.mobileNumber?.value ?? '',
      }
    : undefined;

  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const actionError = fetcher.data?.error;
  const error = loaderError || actionError;

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
