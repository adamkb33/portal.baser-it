import { Form, redirect, useNavigation } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingReady } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { withOverviewReturnTo } from '~/routes/booking/public/_utils/booking-return-to';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingStepTemplate, cn, Container, PageHeader, Text } from '~/ui';
import { formatNorwegianDateTime } from './_utils/format-norwegian-date-time';
import type { Route } from './+types/booking.public.appointment.session.overview.route';

const ROUTE_ID = 'booking.public.appointment.session.overview';
const EDIT_ACTION_CLASS_NAME =
  "relative inline-flex min-h-0 items-baseline justify-end rounded-md px-0 py-0 text-sm font-semibold text-booking-action underline-offset-4 after:absolute after:right-0 after:top-1/2 after:h-11 after:w-11 after:-translate-y-1/2 after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action disabled:opacity-50";

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
      const { message } = resolveErrorPayload(error, 'Kunne ikke bekrefte timebestilling');
      return redirectWithError(request, routes.selectTime, message);
    }
  });
}

export default function BookingOverviewPage({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';
  const pendingIntent = navigation.formData?.get('intent');
  const isConfirming = isSubmitting && navigation.formData !== undefined && pendingIntent !== 'clear';
  const pendingDestination = navigation.location?.pathname;
  const routes = getBookingRouteMap();

  if (!loaderData.sessionOverview) {
    return (
      <Container size="lg">
        <PageHeader title="Oversikt" description="Kunne ikke hente oversikt" />
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
  const companyName = formatCompanyDisplayName(loaderData.companySummary?.name);

  return (
    <BookingStepTemplate label="Oversikt" title="Se over og bekreft" contentClassName="gap-3">
      <div className="mx-auto grid w-full items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
        <div className="overflow-hidden rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised">
          <div className="flex items-start justify-between gap-3 p-4 md:p-5">
            <div className="min-w-0">
              <Text as="h2" variant="heading-sm" className="font-semibold text-booking-text">
                {dateTime.short}
              </Text>
              <Text as="p" variant="body-sm" className="mt-1 text-booking-text-muted">
                {companyName}
              </Text>
            </div>
            <BookingLink
              to={withOverviewReturnTo(routes.selectTime)}
              variant="inline"
              loading={pendingDestination === routes.selectTime}
              disabled={isSubmitting}
              className={EDIT_ACTION_CLASS_NAME}
            >
              Endre<span className="sr-only"> tidspunkt</span>
            </BookingLink>
          </div>

          <dl
            className="grid grid-cols-[minmax(72px,auto)_minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-booking-border px-4 md:px-5"
            aria-label="Bookingoversikt"
          >
            <OverviewSection
              title="Behandler"
              editHref={withOverviewReturnTo(routes.employee)}
              isBusy={isSubmitting}
              isLoading={pendingDestination === routes.employee}
            >
              <Text as="p" variant="body-sm" className="font-medium text-booking-text">
                {sessionOverview.selectedProfile.givenName} {sessionOverview.selectedProfile.familyName}
              </Text>
            </OverviewSection>

            <OverviewSection
              title="Kontakt"
              editHref={`${routes.contact}?edit=1`}
              isBusy={isSubmitting}
              isLoading={pendingDestination === routes.contact}
            >
              <Text as="p" variant="body-sm" className="font-medium text-booking-text">
                {sessionOverview.user.givenName} {sessionOverview.user.familyName}
              </Text>
            </OverviewSection>

            <OverviewSection
              title={sessionOverview.selectedServices.length > 1 ? 'Tjenester' : 'Tjeneste'}
              editHref={withOverviewReturnTo(routes.selectServices)}
              isBusy={isSubmitting}
              isLoading={pendingDestination === routes.selectServices}
              isLast={sessionOverview.selectedServices.length <= 1}
            >
              <div className="space-y-1">
                {sessionOverview.selectedServices.map((item) => (
                  <div
                    key={`${item.serviceGroup.id}-${item.services.id}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <Text as="p" variant="body-sm" className="min-w-0 text-booking-text">
                      <span className="font-medium">
                        {item.services.name}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </span>
                      <span className="text-booking-text-muted">
                        {' '}
                        · fra {item.services.duration * item.quantity} min
                      </span>
                    </Text>
                    <Text as="p" variant="body-sm" className="shrink-0 font-semibold tabular-nums text-booking-text">
                      ca. {item.services.price * item.quantity} kr
                    </Text>
                  </div>
                ))}
                <Text as="p" variant="caption" className="text-booking-text-muted">
                  Estimert pris og varighet. Endelig pris avtales i salongen.
                </Text>
              </div>
            </OverviewSection>

            {sessionOverview.selectedServices.length > 1 ? (
              <OverviewSection title="Estimert total" isLast>
                <Text as="p" variant="body-sm" className="font-semibold tabular-nums text-booking-text">
                  fra {totalDuration} min · ca. {totalPrice} kr
                </Text>
              </OverviewSection>
            ) : null}
          </dl>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-warning/30 bg-warning/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <Text as="p" variant="body-sm" className="text-booking-text">
              Timen er ikke bestilt ennå.
            </Text>
          </div>
          <Form method="post">
            <BookingActionButton
              type="submit"
              variant="confirm"
              fullWidth
              loading={isConfirming}
              disabled={isSubmitting}
            >
              {isConfirming ? 'Bekrefter timebestillingen ...' : 'Bekreft timebestilling'}
            </BookingActionButton>
          </Form>
        </div>
      </div>
    </BookingStepTemplate>
  );
}

function OverviewSection({
  title,
  editHref,
  isBusy = false,
  isLoading = false,
  isLast = false,
  children,
}: {
  title: string;
  editHref?: string;
  isBusy?: boolean;
  isLoading?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const editSubject = title.toLocaleLowerCase('nb-NO');
  const rowBorder = isLast ? '' : 'border-b border-booking-border';

  return (
    <>
      <Text as="dt" variant="body-sm" className={cn('min-h-11 py-3 text-booking-text-muted', rowBorder)}>
        {title}
      </Text>
      <dd className={cn('min-w-0 py-3', rowBorder)}>{children}</dd>
      <dd className={cn('flex min-h-11 items-baseline justify-end py-3', rowBorder)}>
        {editHref ? (
          <BookingLink
            to={editHref}
            variant="inline"
            loading={isLoading}
            disabled={isBusy}
            className={EDIT_ACTION_CLASS_NAME}
          >
            Endre<span className="sr-only"> {editSubject}</span>
          </BookingLink>
        ) : null}
      </dd>
    </>
  );
}

function formatCompanyDisplayName(name?: string | null): string {
  const trimmedName = name?.trim();
  if (!trimmedName) return 'Virksomheten';

  const lettersOnly = trimmedName.replace(/[^\p{L}]/gu, '');
  if (!lettersOnly || lettersOnly !== lettersOnly.toLocaleUpperCase('nb-NO')) {
    return trimmedName;
  }

  return trimmedName
    .toLocaleLowerCase('nb-NO')
    .replace(/(^|[\s-])(\p{L})/gu, (_match, separator: string, letter: string) => {
      return `${separator}${letter.toLocaleUpperCase('nb-NO')}`;
    });
}
