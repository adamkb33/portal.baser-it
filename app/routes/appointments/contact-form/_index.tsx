// app/routes/appointments.$companyId.contact-form.tsx

import { redirect, useLoaderData, useNavigation, useOutletContext, useSubmit } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { GetOrCreateContactForm } from '~/components/forms/get-or-create-contact.form';
import { baseApi, bookingApi } from '~/lib/utils';
import type { GetOrCreateContactSchema } from '~/features/booking/get-or-create-contact.schema';
import { getSessionId } from '~/lib/appointments.server';
import type { AppointmentsOutletContext } from '../layout';

type LoaderData = {
  contact: GetOrCreateContactSchema | null;
  hasExistingContact: boolean;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  const companyId = Number(params.companyId);

  const session =
    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSession({
      sessionId,
    });

  if (!session.contactId) {
    return { contact: null, hasExistingContact: false };
  }

  try {
    const contactResponse =
      await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.getContact({
        companyId,
        contactId: session.contactId,
      });

    const contact = contactResponse.data;

    if (!contact) {
      return { contact: null, hasExistingContact: false };
    }

    return {
      contact: {
        companyId,
        givenName: contact.givenName ?? '',
        familyName: contact.familyName ?? '',
        email: contact.email?.value ?? '',
        mobileNumber: contact.mobileNumberDto?.value ?? '',
      },
      hasExistingContact: true,
    };
  } catch {
    return { contact: null, hasExistingContact: false };
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionId = await getSessionId(request);
  const companyId = Number(params.companyId);

  if (!companyId || Number.isNaN(companyId)) {
    throw new Response('Invalid company ID', { status: 400 });
  }

  const formData = await request.formData();

  const givenName = formData.get('givenName');
  const familyName = formData.get('familyName');
  const email = formData.get('email');
  const mobileNumber = formData.get('mobileNumber');

  if (typeof givenName !== 'string' || typeof familyName !== 'string' || !givenName.trim() || !familyName.trim()) {
    throw new Response('Missing required fields', { status: 400 });
  }

  const contactResponse =
    await baseApi().PublicCompanyContactControllerService.PublicCompanyContactControllerService.getOrCreateContact({
      requestBody: {
        companyId,
        givenName: givenName.trim(),
        familyName: familyName.trim(),
        email: email && typeof email === 'string' && email.trim() ? { id: 0, value: email.trim() } : undefined,
        mobileNumberDto:
          mobileNumber && typeof mobileNumber === 'string' && mobileNumber.trim()
            ? { id: 0, value: mobileNumber.trim() }
            : undefined,
      },
    });

  const contact = contactResponse.data;

  if (!contact?.id) {
    throw new Response('Failed to create contact', { status: 500 });
  }

  await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.addContactToSession({
    sessionId,
    contactId: contact.id,
  });

  // Services step always comes after contact
  throw redirect(`/appointments/${companyId}/contact-form/services`);
}

export default function ContactFormRoute() {
  const { contact, hasExistingContact } = useLoaderData<typeof loader>();
  const { companyId } = useOutletContext<AppointmentsOutletContext>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const isSubmitting = navigation.state === 'submitting';

  const handleContactSubmit = useCallback(
    (values: GetOrCreateContactSchema) => {
      const formData = new FormData();
      formData.append('givenName', values.givenName);
      formData.append('familyName', values.familyName);
      if (values.email) formData.append('email', values.email);
      if (values.mobileNumber) formData.append('mobileNumber', values.mobileNumber);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  return (
    <>
      {contact && hasExistingContact && (
        <div className="mb-3 flex items-center gap-2 border border-border bg-muted px-3 py-2 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Dine tidligere kontaktopplysninger er forhåndsutfylt</span>
        </div>
      )}

      <GetOrCreateContactForm
        companyId={companyId}
        onSubmit={handleContactSubmit}
        onChange={undefined}
        isSubmitting={isSubmitting}
        initialValues={contact ?? undefined}
      />
    </>
  );
}
