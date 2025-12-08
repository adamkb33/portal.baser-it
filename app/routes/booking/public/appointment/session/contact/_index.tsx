import {
  data,
  redirect,
  useLoaderData,
  useFetcher,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { SubmitContactForm } from '~/routes/booking/public/appointment/session/contact/_forms/submit-contact.form';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { baseApi, bookingApi } from '~/lib/utils';
import { BookingContainer, BookingSection, BookingMeta } from '../../_components/booking-layout';
import type { SubmitContactFormSchema } from './_schemas/submit-contact.form.schema';
import { ErrorBanner } from '../../_components/error.banner';

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
    <>
      {error && <ErrorBanner message={error} />}

      <BookingContainer>
        <BookingSection label="Kontaktinformasjon" title="Hvem skal vi registrere avtalen på?">
          {existingContact && (
            <div className="border-t border-border pt-4 space-y-3">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Eksisterende kontakt
              </span>
              <BookingSection variant="muted" className="space-y-2">
                <BookingMeta
                  items={[
                    { label: 'Navn', value: `${existingContact.givenName} ${existingContact.familyName}` },
                    ...(existingContact.email?.value ? [{ label: 'E-post', value: existingContact.email.value }] : []),
                    ...(existingContact.mobileNumber?.value
                      ? [{ label: 'Mobil', value: existingContact.mobileNumber.value }]
                      : []),
                  ]}
                />
                <p className="text-[0.7rem] text-muted-foreground">Du kan oppdatere informasjonen under om nødvendig</p>
              </BookingSection>
            </div>
          )}

          <SubmitContactForm
            companyId={session.companyId}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </BookingSection>
      </BookingContainer>
    </>
  );
}
