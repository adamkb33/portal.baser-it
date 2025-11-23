// app/routes/appointments.$companyId.contact-form.tsx
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  Outlet,
  data,
  redirect,
  useFetcher,
  useLoaderData,
} from 'react-router';
import { useCallback, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BookingStep } from '~/components/booking/booking-step';
import { GetOrCreateContactForm } from '~/components/forms/get-or-create-contact.form';
import { baseApi, bookingApi } from '~/lib/utils';
import { appointmentSessionCookie } from '../layout';
import type { GetOrCreateContactSchema } from '~/features/booking/get-or-create-contact.schema';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/booking';

const CONTACT_INTENT = {
  GET: 'getContact',
  GET_OR_CREATE: 'getOrCreateContact',
} as const;

type ContactIntent = (typeof CONTACT_INTENT)[keyof typeof CONTACT_INTENT];

type GetContactActionData =
  | {
      initialValues: GetOrCreateContactSchema;
      error?: undefined;
    }
  | {
      initialValues?: undefined;
      error: string;
    };

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = await appointmentSessionCookie.parse(cookieHeader);

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Response('Missing appointment session', { status: 400 });
  }

  try {
    const session: AppointmentSessionDto =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSession({
        sessionId,
      });

    return session;
  } catch (error: unknown) {
    const apiErr = error as ApiClientError;
    if (apiErr?.body?.message) {
      throw new Response(apiErr.body.message, {
        status: apiErr.status ?? 500,
      });
    }
    throw error;
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ ok: false }, { status: 405 });
  }

  const companyIdParam = params.companyId;
  const companyId = Number(companyIdParam);

  if (!companyIdParam || Number.isNaN(companyId)) {
    return data({ error: 'Invalid companyId' }, { status: 400 });
  }

  const cookieHeader = request.headers.get('Cookie');
  const sessionId = await appointmentSessionCookie.parse(cookieHeader);

  if (!sessionId || typeof sessionId !== 'string') {
    return data({ error: 'Missing appointment session' }, { status: 400 });
  }

  const formData = await request.formData();

  const rawIntent = formData.get('intent');
  const intent: ContactIntent =
    typeof rawIntent === 'string' ? (rawIntent as ContactIntent) : CONTACT_INTENT.GET_OR_CREATE;

  if (intent === CONTACT_INTENT.GET) {
    const contactIdValue = formData.get('contactId');

    if (typeof contactIdValue !== 'string' || contactIdValue.trim() === '') {
      return data<GetContactActionData>({ error: 'Missing contactId' }, { status: 400 });
    }

    const contactId = Number(contactIdValue);
    if (Number.isNaN(contactId)) {
      return data<GetContactActionData>({ error: 'Invalid contactId' }, { status: 400 });
    }

    const contactResponse =
      await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.getContact({
        companyId,
        contactId,
      });

    const contact = contactResponse.data;

    if (!contact) {
      return data<GetContactActionData>({ error: 'Contact not found' }, { status: 404 });
    }

    const initialValues: GetOrCreateContactSchema = {
      companyId,
      givenName: contact.givenName ?? '',
      familyName: contact.familyName ?? '',
      email: contact.email?.value ?? '',
      mobileNumber: contact.mobileNumberDto?.value ?? '',
    };

    return data<GetContactActionData>({ initialValues });
  }

  // intent === GET_OR_CREATE
  const givenName = formData.get('givenName');
  const familyName = formData.get('familyName');
  const email = formData.get('email');
  const mobileNumber = formData.get('mobileNumber');

  if (
    typeof givenName !== 'string' ||
    typeof familyName !== 'string' ||
    givenName.trim() === '' ||
    familyName.trim() === ''
  ) {
    return data({ error: 'Missing required fields' }, { status: 400 });
  }

  const requestBody = {
    companyId,
    givenName,
    familyName,
    email: typeof email === 'string' && email.trim() !== '' ? { id: 0, value: email } : undefined,
    mobileNumberDto:
      typeof mobileNumber === 'string' && mobileNumber.trim() !== '' ? { id: 0, value: mobileNumber } : undefined,
  };

  const contactResponse =
    await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.getOrCreateContact({
      requestBody,
    });

  const contact = contactResponse.data;

  if (!contact || typeof contact.id !== 'number') {
    return data({ error: 'Failed to create contact' }, { status: 400 });
  }

  await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.addContactToSession({
    sessionId,
    contactId: contact.id,
  });

  return redirect(`/appointments/${companyId}/contact-form/services`);
}

export default function AppointmentsContactFormLayout() {
  const session = useLoaderData<typeof loader>();
  const companyId = session.companyId;
  const contactId = session.contactId ?? null;

  const prefillFetcher = useFetcher<GetContactActionData>();
  const submitFetcher = useFetcher();

  const isSubmitting = submitFetcher.state !== 'idle';

  useEffect(() => {
    if (!contactId) return;
    if (prefillFetcher.state !== 'idle') return;
    if (prefillFetcher.data?.initialValues) return;

    const formData = new FormData();
    formData.append('intent', CONTACT_INTENT.GET);
    formData.append('contactId', String(contactId));

    prefillFetcher.submit(formData, {
      method: 'post',
      action: `/appointments/${companyId}/contact-form`,
    });
  }, [companyId, contactId, prefillFetcher]);

  const savedContactData = prefillFetcher.data?.initialValues ?? null;

  const handleContactSubmit = useCallback(
    (values: GetOrCreateContactSchema) => {
      const formData = new FormData();
      formData.append('intent', CONTACT_INTENT.GET_OR_CREATE);
      formData.append('givenName', values.givenName);
      formData.append('familyName', values.familyName);
      if (values.email) formData.append('email', values.email);
      if (values.mobileNumber) {
        formData.append('mobileNumber', values.mobileNumber);
      }

      submitFetcher.submit(formData, {
        method: 'post',
        action: `/appointments/${companyId}/contact-form`,
      });
    },
    [submitFetcher, companyId],
  );

  return (
    <>
      <BookingStep
        stepNumber={1}
        stepValue="contact"
        title="Oppgi kontaktopplysninger"
        description={
          contactId ? 'Kontaktopplysninger lagret' : 'Vi trenger dine kontaktopplysninger for å bekrefte avtalen'
        }
        isCompleted={!!contactId}
      >
        {savedContactData && !contactId && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Dine tidligere kontaktopplysninger er forhåndsutfylt</span>
          </div>
        )}

        <GetOrCreateContactForm
          companyId={companyId}
          onSubmit={handleContactSubmit}
          onChange={undefined}
          isSubmitting={isSubmitting}
          initialValues={savedContactData || undefined}
        />
      </BookingStep>
      <Outlet />
    </>
  );
}
