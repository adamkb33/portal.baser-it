import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { BookingFooterNav } from '~/routes/booking/public/_components/booking-footer-nav';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingReady } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { redirect } from 'react-router';
import { Form, Link, useNavigation } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { BookingStepTemplate, Container, PageHeader, Text } from '~/ui';
import { formatNorwegianDateTime } from './_utils/format-norwegian-date-time';
import type { Route } from './+types/booking.public.appointment.session.overview.route';

const ROUTE_ID = 'booking.public.appointment.session.overview';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'overview' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingReady(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const [response, companySummary] = await Promise.all([
        withBookingBackendCall({ request, routeId: ROUTE_ID, step: 'overview', call: 'get-overview', session }, () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.getAppointmentSessionOverview({
              query: {
                sessionId: session.sessionId,
              },
            }),
          ),
        ),
        withBookingBackendCall(
          { request, routeId: ROUTE_ID, step: 'overview', call: 'get-company-summary', session },
          () => getBookingCompanySummary(session.companyId, request),
        ),
      ]);

      if (!response.data?.data) {
        const message = response.data?.message || 'Kunne ikke hente oversikt';
        return redirectWithError(request, routes.selectTime, message);
      }

      return {
        sessionOverview: response.data.data,
        companySummary,
      };
    } catch (error) {
      // Session/company context is still valid here (requireBookingReady already passed) —
      // stay inside the booking flow instead of ejecting to the company picker.
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente oversikt');
      return redirectWithError(request, routes.selectTime, message);
    }
  });
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'overview' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingReady(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const submitResponse = await withBookingBackendCall(
        { request, routeId: ROUTE_ID, step: 'overview', call: 'submit-appointment', session },
        () =>
          withAuth(request, () =>
            PublicAppointmentSessionController.submitAppointmentSession({
              query: {
                sessionId: session.sessionId,
              },
            }),
          ),
      );

      const appointmentId = submitResponse.data?.data?.appointmentId;
      if (!appointmentId) {
        return redirectWithError(request, routes.overview, 'Kunne ikke bekrefte timebestilling');
      }

      return redirect(`${routes.success}?companyId=${session.companyId}&appointmentId=${appointmentId}`);
    } catch (error) {
      // Same as above — e.g. the slot became unavailable between selection and submit.
      // The session/company is still valid, so send them back to pick a new time
      // instead of ejecting to the company picker.
      const { message } = resolveErrorPayload(error, 'Kunne ikke bekrefte timebestilling');
      return redirectWithError(request, routes.selectTime, message);
    }
  });
}

export default function BookingOverviewPage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';
  const routes = getBookingRouteMap();

  if (!loaderData.sessionOverview) {
    return (
      <Container size="lg">
        <PageHeader title="Bekreft timebestilling" description="Kunne ikke hente oversikt" />
      </Container>
    );
  }

  const { sessionOverview } = loaderData;
  const totalDuration =
    sessionOverview.totalDurationMinutes ??
    sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.duration * item.quantity, 0);
  const totalPrice =
    sessionOverview.totalPrice ??
    sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.price * item.quantity, 0);
  const dateTime = formatNorwegianDateTime(sessionOverview.selectedStartTime);
  const confirmFormId = 'booking-overview-confirm-form';
  const editLinkClass = 'text-sm font-semibold text-booking-action hover:underline';

  return (
    <BookingStepTemplate
      title="Bekreft timebestilling"
      description="Gjennomgå detaljene før du bekrefter."
      headerMeta={<BookingCompanyBadge company={loaderData.companySummary} />}
    >
      <Form id={confirmFormId} method="post" className="hidden" />
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised shadow-[var(--shadow-booking-card)]">
        <OverviewSection title="Tidspunkt" editHref={routes.selectTime} editLinkClass={editLinkClass}>
          <Text as="p" variant="body" className="font-semibold text-booking-text">
            {dateTime.full}
          </Text>
          <Text as="p" variant="body-sm" className="text-booking-text-muted">
            {totalDuration} min
          </Text>
        </OverviewSection>

        <OverviewSection title="Kontakt" editHref={routes.contact} editLinkClass={editLinkClass}>
          <Text as="p" variant="body" className="font-semibold text-booking-text">
            {sessionOverview.user.givenName} {sessionOverview.user.familyName}
          </Text>
          {sessionOverview.user.email ? (
            <Text as="p" variant="body-sm" className="text-booking-text-muted">
              {sessionOverview.user.email}
            </Text>
          ) : null}
        </OverviewSection>

        <OverviewSection title="Behandler" editHref={routes.employee} editLinkClass={editLinkClass}>
          <Text as="p" variant="body" className="font-semibold text-booking-text">
            {sessionOverview.selectedProfile.givenName} {sessionOverview.selectedProfile.familyName}
          </Text>
        </OverviewSection>

        <OverviewSection title="Tjenester" editHref={routes.selectServices} editLinkClass={editLinkClass}>
          <div className="divide-y divide-booking-border">
            {sessionOverview.selectedServices.map((item) => (
              <div key={`${item.serviceGroup.id}-${item.services.id}`} className="flex gap-4 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Text as="p" variant="body-sm" className="font-medium text-booking-text">
                    {item.services.name}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </Text>
                  <Text as="p" variant="caption" className="text-booking-text-muted">
                    {item.services.duration * item.quantity} min
                  </Text>
                </div>
                <Text as="p" variant="body-sm" className="shrink-0 tabular-nums text-booking-text">
                  {item.services.price * item.quantity} kr
                </Text>
              </div>
            ))}
          </div>
        </OverviewSection>

        <div className="flex items-center justify-between gap-4 border-t-2 border-booking-action/30 bg-booking-action/10 px-4 py-4 md:px-5">
          <Text as="p" variant="label" className="text-booking-text">
            Totalt
          </Text>
          <div className="text-right">
            <Text as="p" variant="body" className="tabular-nums font-bold text-booking-text">
              {totalPrice} kr
            </Text>
            <Text as="p" variant="caption" className="text-booking-text-muted">
              {totalDuration} min
            </Text>
          </div>
        </div>
      </div>
      <BookingFooterNav>
        <BookingLink to={routes.selectTime} variant="secondary" disabled={isSubmitting}>
          Endre tid
        </BookingLink>
        <BookingActionButton
          type="submit"
          form={confirmFormId}
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <CheckCircle2 className="size-4" strokeWidth={2.5} />
          Bekreft
        </BookingActionButton>
      </BookingFooterNav>
    </BookingStepTemplate>
  );
}

function OverviewSection({
  title,
  editHref,
  editLinkClass,
  children,
}: {
  title: string;
  editHref: string;
  editLinkClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-booking-border px-4 py-4 md:px-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <Text as="h2" variant="label" className="text-booking-text">
          {title}
        </Text>
        <Link to={editHref} className={editLinkClass}>
          Endre
        </Link>
      </div>
      {children}
    </section>
  );
}
