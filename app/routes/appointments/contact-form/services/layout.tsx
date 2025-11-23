// app/routes/appointments.$companyId.contact-form.services.tsx
import { type LoaderFunctionArgs, data, useLoaderData } from 'react-router';
import { useCallback, useMemo, useState } from 'react';
import type { ApiClientError } from '~/api/clients/http';
import { bookingApi } from '~/lib/utils';
import type { AppointmentSessionDto } from '~/api/clients/booking';
import { BookingStep } from '~/components/booking/booking-step';
import type { GroupedServiceGroupsDto } from 'tmp/openapi/gen/booking';
import { appointmentSessionCookie } from '~/routes/appointments';
import { ServicePicker } from '~/components/pickers/service-picker';

type LoaderData = {
  session: AppointmentSessionDto;
  groupedServices: GroupedServiceGroupsDto[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = await appointmentSessionCookie.parse(cookieHeader);

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Response('Missing appointment session', { status: 400 });
  }

  try {
    const [session, groupedServices] = await Promise.all([
      bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSession({
        sessionId,
      }),
      bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentServices({
        sessionId,
      }),
    ]);

    return data<LoaderData>({ session, groupedServices });
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

export default function AppointmentsContactFormServicesLayout() {
  const { session, groupedServices } = useLoaderData<typeof loader>();

  const initialServiceIds = useMemo(() => session.selectedServices ?? [], [session.selectedServices]);

  const [serviceIds, setServiceIds] = useState(initialServiceIds);

  const allServices = useMemo(() => groupedServices.flatMap((group) => group.services ?? []), [groupedServices]);

  const selectedServiceNames = useMemo(
    () => allServices.filter((service) => serviceIds.includes(service.id)).map((service) => service.name),
    [allServices, serviceIds],
  );

  const handleServicesChange = useCallback((nextIds: number[]) => {
    setServiceIds(nextIds);
    // TODO: persist selection to session via action/fetcher
  }, []);

  return (
    <BookingStep
      stepNumber={2}
      stepValue="services"
      title="Velg tjenester"
      description={
        serviceIds.length > 0
          ? selectedServiceNames.join(', ')
          : 'Du kan velge én eller flere tjenester som inngår i avtalen'
      }
      isCompleted={serviceIds.length > 0}
    >
      {groupedServices.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Ingen tjenester tilgjengelig for dette selskapet
        </div>
      )}

      {groupedServices.length > 0 && (
        <ServicePicker
          groupedServices={groupedServices}
          selectedServiceIds={serviceIds}
          onChange={handleServicesChange}
        />
      )}
    </BookingStep>
  );
}
