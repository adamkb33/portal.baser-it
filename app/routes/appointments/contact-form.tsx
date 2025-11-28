import { data, redirect, useLoaderData, type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto, GetOrCreateContactDto } from '~/api/clients/types';
import { GetOrCreateContactFetcherForm } from '~/components/forms/contact-form';
import { getSession } from '~/lib/appointments.server';
import { baseApi, bookingApi } from '~/lib/utils';

export type AppointmentsContactFormLoaderData = {
  session: AppointmentSessionDto;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect('/appointments');
    }

    return data<AppointmentsContactFormLoaderData>({ session });
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

    const requestBody: GetOrCreateContactDto = {
      companyId: Number(formData.get('companyId')),
      givenName: String(formData.get('givenName') ?? ''),
      familyName: String(formData.get('familyName') ?? ''),
      email: formData.get('email') ? String(formData.get('email')) : undefined,
      mobileNumber: formData.get('mobileNumber') ? String(formData.get('mobileNumber')) : undefined,
    };

    const contactResponse =
      await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.getOrCreateContact({
        requestBody,
      });

    if (!contactResponse.data) {
      return { error: 'En feil har skjedd med lagring av kontakt' };
    }

    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.addContactToSession({
      sessionId: session.sessionId,
      contactId: contactResponse.data.id,
    });

    return redirect('/appointments/employee');
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AppointmentsContactForm() {
  const loaderData = useLoaderData<AppointmentsContactFormLoaderData>();
  const { session, error } = loaderData;

  return (
    <div className="flex justify-center px-4 py-6">
      <div className="w-full max-w-xl border border-border p-4 sm:p-5 space-y-5 bg-white">
        {/* Header block (brutalist typography) */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Kontaktinformasjon</p>
          <h1 className="text-base font-semibold text-foreground">Hvem skal vi registrere avtalen på?</h1>
          {error ? <p className="text-[0.8rem] text-destructive">{error}</p> : null}
        </div>

        {/* Contact form */}
        <GetOrCreateContactFetcherForm
          companyId={session.companyId}
          onSuccess={(values) => {
            console.log('Client-side contact form submission:', values);
          }}
        />
      </div>
    </div>
  );
}
