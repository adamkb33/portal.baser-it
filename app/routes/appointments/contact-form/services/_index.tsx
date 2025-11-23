// app/routes/appointments.$companyId.contact-form.services.tsx

import { redirect, useLoaderData, useNavigation, useOutletContext, useSubmit } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useCallback } from 'react';
import { ServicePicker } from '~/components/pickers/service-picker';
import { bookingApi } from '~/lib/utils';
import type { AppointmentSessionDto, GroupedServiceGroupsDto } from '~/api/clients/types';
import { getSessionId } from '~/lib/appointments.server';
import type { AppointmentsOutletContext } from '../../layout';

type LoaderData = {
  session: AppointmentSessionDto;
  groupedServices: GroupedServiceGroupsDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);

  const [session, groupedServices] = await Promise.all([
    bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSession({
      sessionId,
    }),
    bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentServices({
      sessionId,
    }),
  ]);

  return { session, groupedServices };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionId = await getSessionId(request);
  const companyId = Number(params.companyId);

  if (!companyId || Number.isNaN(companyId)) {
    throw new Response('Invalid company ID', { status: 400 });
  }

  const formData = await request.formData();
  const serviceIdsRaw = formData.get('serviceIds');

  if (typeof serviceIdsRaw !== 'string' || !serviceIdsRaw.trim()) {
    throw new Response('No services selected', { status: 400 });
  }

  let selectedServices: number[];
  try {
    selectedServices = JSON.parse(serviceIdsRaw);
  } catch {
    throw new Response('Invalid service data', { status: 400 });
  }

  if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
    throw new Response('At least one service must be selected', { status: 400 });
  }

  await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.selectAppointmentSessionServices(
    {
      requestBody: {
        sessionId,
        selectedServices,
      },
    },
  );

  // Redirect to next step - dynamically determined by parent
  // If only 1 employee: skips employee step → goes to time
  // If multiple employees: goes to employee step
  const nextStepKey = formData.get('nextStepKey');
  const nextStepPath = formData.get('nextStepPath');

  if (typeof nextStepPath === 'string' && nextStepPath) {
    throw redirect(`/appointments/${companyId}/${nextStepPath}`);
  }

  // Fallback: assume employee step exists
  throw redirect(`/appointments/${companyId}/contact-form/services/employee`);
}

export default function ServicesRoute() {
  const { session, groupedServices } = useLoaderData<LoaderData>();
  const { companyId, steps, currentStepIndex } = useOutletContext<AppointmentsOutletContext>();
  const navigation = useNavigation();
  const submit = useSubmit();

  const isSubmitting = navigation.state === 'submitting';

  // Find next step after current
  const nextStep = steps[currentStepIndex + 1];

  const handleServicesSubmit = useCallback(
    (serviceIds: number[]) => {
      const formData = new FormData();
      formData.append('serviceIds', JSON.stringify(serviceIds));

      // Pass next step info to action
      if (nextStep) {
        formData.append('nextStepKey', nextStep.key);
        formData.append('nextStepPath', nextStep.path);
      }

      submit(formData, { method: 'post' });
    },
    [submit, nextStep],
  );

  return (
    <>
      {groupedServices.length === 0 && (
        <div className="border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Ingen tjenester tilgjengelig for dette selskapet
        </div>
      )}

      {groupedServices.length > 0 && (
        <ServicePicker
          groupedServices={groupedServices}
          initialSelectedIds={session.selectedServices ?? []}
          onSubmit={handleServicesSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
