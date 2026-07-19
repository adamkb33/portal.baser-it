import { useEffect, useMemo, useState } from 'react';
import { Form, data, redirect, useNavigation } from 'react-router';
import { Search, Sparkles, X } from 'lucide-react';
import type { GroupedServiceDto } from '~/api/generated/booking';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { BookingFooterNav } from '~/routes/booking/public/_components/booking-footer-nav';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingStepTemplate, Container, Input, PageHeader, Stack } from '~/ui';
import { ServiceGroup } from './_components/service-group';
import { ServiceImageDialog } from './_components/service-image-dialog';
import type { Route } from './+types/booking.public.appointment.session.select-services.route';

const ROUTE_ID = 'booking.public.appointment.session.select-services';
const MAX_TOTAL_SERVICES = 5;

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'select-services' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingSession(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;

      const [serviceGroupsResponse, companySummary] = await Promise.all([
        withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'select-services', call: 'get-profile-services', session },
          () =>
            PublicAppointmentSessionController.getAppointmentSessionProfileServices({
              query: {
                sessionId: session.sessionId,
              },
            }),
        ),
        withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'select-services', call: 'get-company-summary', session },
          () => getBookingCompanySummary(session.companyId),
        ),
      ]);

      return data({
        session,
        serviceGroups: serviceGroupsResponse.data?.data || [],
        companySummary,
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente tjenester');
      return redirectWithError(request, routes.employee, message);
    }
  });
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'select-services' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingSession(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const formData = await request.formData();
      const selectedServices = Array.from(formData.entries())
        .filter(([key]) => key.startsWith('serviceQuantity:'))
        .map(([key, value]) => {
          const serviceId = Number(key.replace('serviceQuantity:', ''));
          const quantity = Number(value);
          return { serviceId, quantity };
        })
        .filter(
          (item) =>
            Number.isInteger(item.serviceId) &&
            item.serviceId > 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        );

      await withBookingBackendCall(
        {
          request,
          routeId: ROUTE_ID,
          step: 'select-services',
          call: 'select-profile-services',
          session,
          context: { selectedServicesCount: selectedServices.length },
        },
        () =>
          PublicAppointmentSessionController.selectAppointmentSessionProfileServices({
            body: {
              selectedServices,
            },
            query: {
              sessionId: session.sessionId,
            },
          }),
      );

      return redirect(routes.selectTime);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke lagre tjenestevalg');
      return redirectWithError(request, routes.selectServices, message);
    }
  });
}

export default function BookingSelectServicesPage({ loaderData }: Route.ComponentProps) {
  const serviceGroups = loaderData.serviceGroups ?? [];
  const session = loaderData.session;
  const routes = getBookingRouteMap();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [selectedServiceQuantities, setSelectedServiceQuantities] = useState<Map<number, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogService, setDialogService] = useState<GroupedServiceDto | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const nextMap = new Map<number, number>();
    for (const selectedService of session.selectedServices ?? []) {
      const serviceId = Number(selectedService.serviceId);
      const quantity = Number(selectedService.quantity);
      if (Number.isInteger(serviceId) && serviceId > 0 && Number.isInteger(quantity) && quantity > 0) {
        nextMap.set(serviceId, quantity);
      }
    }
    setSelectedServiceQuantities(nextMap);
  }, [session]);

  if (!session) {
    return (
      <Container size="lg">
        <PageHeader title="Velg tjenester" description="Ugyldig økt" />
      </Container>
    );
  }

  const findService = (serviceId: number): GroupedServiceDto | undefined => {
    for (const group of serviceGroups) {
      const service = group.services.find((candidate) => candidate.id === serviceId);
      if (service) return service;
    }
    return undefined;
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return serviceGroups;

    const query = searchQuery.toLowerCase();
    return serviceGroups
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => service.name.toLowerCase().includes(query)),
      }))
      .filter((group) => group.services.length > 0);
  }, [serviceGroups, searchQuery]);

  const totalSelectedQuantity = useMemo(
    () => Array.from(selectedServiceQuantities.values()).reduce((sum, quantity) => sum + quantity, 0),
    [selectedServiceQuantities],
  );
  const atServiceLimit = totalSelectedQuantity >= MAX_TOTAL_SERVICES;

  const setServiceQuantity = (serviceId: number, nextQuantity: number) => {
    setSelectedServiceQuantities((prev) => {
      const currentQuantity = prev.get(serviceId) ?? 0;
      const nextTotal = totalSelectedQuantity - currentQuantity + nextQuantity;
      if (nextQuantity > currentQuantity && nextTotal > MAX_TOTAL_SERVICES) {
        return prev;
      }

      const next = new Map(prev);
      if (nextQuantity <= 0) {
        next.delete(serviceId);
      } else {
        next.set(serviceId, nextQuantity);
      }
      return next;
    });
  };

  const selectedServicesList = useMemo(() => {
    return Array.from(selectedServiceQuantities.entries())
      .map(([serviceId, quantity]) => {
        const service = findService(serviceId);
        return service ? { service, quantity } : null;
      })
      .filter((item): item is { service: GroupedServiceDto; quantity: number } => item !== null);
  }, [selectedServiceQuantities]);

  const hasSelections = selectedServicesList.length > 0;
  const submitFormId = 'booking-select-services-submit-form';
  const totalServices = serviceGroups.reduce((sum, group) => sum + group.services.length, 0);

  return (
    <BookingStepTemplate
      label="Velg tjenester"
      title="Hvilke tjenester ønsker du?"
      description={`Velg én eller flere tjenester fra ${totalServices} tilgjengelige tjenester.`}
      headerMeta={<BookingCompanyBadge company={loaderData.companySummary} />}
    >
      <Stack space="lg">
        {totalServices > 6 && (
          <div className="relative rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-muted p-2 md:p-3">
            <Input
              type="text"
              placeholder="Søk etter tjenester..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              variant="booking"
              startIcon={<Search className="text-booking-text-muted" />}
              className="pr-11"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[var(--radius-booking-badge)] p-1 transition-colors hover:bg-booking-surface-strong"
              >
                <X className="size-4 text-booking-text-muted" />
              </button>
            )}
          </div>
        )}

        <Stack space="lg">
          {filteredGroups.length > 0 ? (
            filteredGroups
              .filter((group) => group.services.length > 0)
              .map((group) => (
                <ServiceGroup
                  key={group.id}
                  group={group}
                  selectedServiceQuantities={selectedServiceQuantities}
                  onSetServiceQuantity={setServiceQuantity}
                  onViewImages={setDialogService}
                  disableIncrement={atServiceLimit}
                />
              ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-selected)] border-dashed border-booking-border bg-booking-surface-subtle py-12 text-center">
              <Search className="size-12 text-booking-text-muted opacity-50" />
              <p className="mt-4 text-base font-medium text-booking-text">Ingen tjenester funnet</p>
              <p className="mt-1 text-sm text-booking-text-muted">Prøv et annet søkeord</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm font-medium text-booking-action hover:underline"
              >
                Tilbakestill søk
              </button>
            </div>
          )}
        </Stack>
      </Stack>

      <ServiceImageDialog service={dialogService} onClose={() => setDialogService(null)} />

      <Form id={submitFormId} method="post" className="hidden">
        {Array.from(selectedServiceQuantities.entries()).map(([serviceId, quantity]) => (
          <input key={serviceId} type="hidden" name={`serviceQuantity:${serviceId}`} value={quantity} />
        ))}
      </Form>
      <BookingFooterNav
        message={atServiceLimit ? 'Du har valgt maks 5 tjenester. Fjern en for å velge en annen.' : undefined}
      >
        <BookingLink to={routes.employee} variant="secondary" disabled={isSubmitting} className="invisible">
          Tilbake
        </BookingLink>
        <BookingActionButton
          type="submit"
          form={submitFormId}
          variant="primary"
          loading={isSubmitting}
          disabled={!hasSelections || isSubmitting}
        >
          <Sparkles className="size-4" />
          Fortsett
        </BookingActionButton>
      </BookingFooterNav>
    </BookingStepTemplate>
  );
}
