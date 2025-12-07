import { id } from 'date-fns/locale';
import { data, redirect, useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { GetOrCreateContactFetcherForm } from '~/components/forms/contact-form';
import { getSession } from '~/lib/appointments.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { baseApi, bookingApi } from '~/lib/utils';

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
            id: Number(formData.get('id')) ?? null,
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

    return redirect(ROUTES_MAP['booking.public.appointment.employee'].href);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AppointmentsContactForm() {
  const { session, existingContact, error } = useLoaderData<AppointmentsContactFormLoaderData>();

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

  return (
    <div className="w-full space-y-5">
      <div className="border border-border bg-background p-4 sm:p-5 space-y-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Kontaktinformasjon</p>
          <h1 className="text-base font-semibold text-foreground">Hvem skal vi registrere avtalen på?</h1>
          {error && <p className="text-[0.8rem] text-destructive">{error}</p>}
        </div>

        {existingContact && (
          <div className="border-t border-border pt-4 space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Eksisterende kontakt
            </span>
            <div className="border border-border bg-muted p-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[0.7rem] text-muted-foreground">Navn:</span>
                <span className="text-sm text-foreground">
                  {existingContact.givenName} {existingContact.familyName}
                </span>
              </div>
              {existingContact.email?.value && (
                <div className="flex items-baseline gap-2">
                  <span className="text-[0.7rem] text-muted-foreground">E-post:</span>
                  <span className="text-sm text-foreground">{existingContact.email.value}</span>
                </div>
              )}
              {existingContact.mobileNumber?.value && (
                <div className="flex items-baseline gap-2">
                  <span className="text-[0.7rem] text-muted-foreground">Mobil:</span>
                  <span className="text-sm text-foreground">{existingContact.mobileNumber.value}</span>
                </div>
              )}
            </div>
            <p className="text-[0.7rem] text-muted-foreground">Du kan oppdatere informasjonen under om nødvendig</p>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <GetOrCreateContactFetcherForm
            companyId={session.companyId}
            initialValues={initialValues}
            onSuccess={(values) => {
              console.log('Client-side contact form submission:', values);
            }}
          />
        </div>
      </div>
    </div>
  );
}
