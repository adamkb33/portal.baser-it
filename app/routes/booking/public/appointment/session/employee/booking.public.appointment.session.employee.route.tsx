import { Form, data, redirect, useNavigation } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingActionButton } from '~/routes/booking/public/_components/booking-action-button';
import { BookingFooterNav } from '~/routes/booking/public/_components/booking-footer-nav';
import { BookingLink } from '~/routes/booking/public/_components/booking-link';
import { BookingStepTemplate, Grid, Notice } from '~/ui';
import { ProfileCard } from './_components/profile-card';
import type { Route } from './+types/booking.public.appointment.session.employee.route';

const ROUTE_ID = 'booking.public.appointment.session.employee';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'employee' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingSession(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const companySummary = await withBookingBackendCall(
        { request, routeId: ROUTE_ID, step: 'employee', call: 'get-company-summary', session },
        () => getBookingCompanySummary(session.companyId),
      );
      const profilesResponse = await withBookingBackendCall(
        { request, routeId: ROUTE_ID, step: 'employee', call: 'get-profiles', session },
        () =>
          PublicAppointmentSessionController.getAppointmentSessionProfiles({
            query: {
              sessionId: session.sessionId,
            },
          }),
      );

      const profiles = profilesResponse.data?.data || [];

      if (profiles.length === 1) {
        const onlyProfile = profiles[0];

        if (session.selectedProfileId !== onlyProfile.id) {
          await withBookingBackendCall(
            { request, routeId: ROUTE_ID, step: 'employee', call: 'select-profile', session },
            () =>
              PublicAppointmentSessionController.selectAppointmentSessionProfile({
                query: {
                  sessionId: session.sessionId,
                  selectedProfileId: onlyProfile.id,
                },
              }),
          );
        }

        return redirect(routes.selectServices);
      }

      return data({
        session,
        profiles,
        selectedProfileId: session.selectedProfileId,
        companySummary,
        error: null as string | null,
      });
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke hente frisører');
      return data({
        session: null,
        profiles: [],
        selectedProfileId: null,
        companySummary: null,
        error: message,
      });
    }
  });
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'employee' }, async () => {
    const routes = getBookingRouteMap();

    try {
      const guardResult = await requireBookingSession(request);
      if (guardResult instanceof Response) {
        return guardResult;
      }

      const { session } = guardResult;
      const formData = await request.formData();
      const selectedProfileId = formData.get('selectedProfileId') as string;

      await withBookingBackendCall(
        {
          request,
          routeId: ROUTE_ID,
          step: 'employee',
          call: 'select-profile',
          session,
          context: { selectedProfileId: Number(selectedProfileId) },
        },
        () =>
          PublicAppointmentSessionController.selectAppointmentSessionProfile({
            query: {
              sessionId: session.sessionId,
              selectedProfileId: Number(selectedProfileId),
            },
          }),
      );

      return redirect(routes.selectServices);
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke velge frisør');
      return redirectWithError(request, routes.employee, message);
    }
  });
}

export default function BookingEmployeePage({ loaderData }: Route.ComponentProps) {
  const profiles = loaderData.profiles ?? [];
  const selectedProfileId = loaderData.selectedProfileId;
  const routes = getBookingRouteMap();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const submittingProfileId = navigation.formData?.get('selectedProfileId');

  return (
    <BookingStepTemplate
      label="Velg behandler"
      title="Hvem skal vi bestille avtalen på?"
      description={
        selectedProfileId
          ? 'Du har allerede valgt en frisør. Du kan endre valget eller fortsette.'
          : 'Velg en frisør for å fortsette med timebestilling'
      }
      headerMeta={<BookingCompanyBadge company={loaderData.companySummary} />}
    >
      {loaderData.error ? (
        <Notice variant="booking" tone="emphasis" title="Kunne ikke hente behandlere" message={loaderData.error} />
      ) : null}
      <Grid columns={2}>
        {profiles.map((profile) => {
          const isSelected = selectedProfileId === profile.id;
          const isSubmittingProfile =
            isSubmitting && submittingProfileId !== null && String(profile.id) === String(submittingProfileId);

          return (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isSelected={isSelected}
              isSubmitting={isSubmitting}
              isSubmittingProfile={isSubmittingProfile}
            />
          );
        })}
      </Grid>
      <BookingFooterNav>
        <BookingLink to={routes.contact} variant="secondary" disabled={isSubmitting}>
          Tilbake
        </BookingLink>
        {selectedProfileId ? (
          <BookingLink to={routes.selectServices} variant="primary" disabled={isSubmitting}>
            Fortsett
          </BookingLink>
        ) : (
          <BookingActionButton type="button" variant="primary" disabled>
            Velg behandler
          </BookingActionButton>
        )}
      </BookingFooterNav>
    </BookingStepTemplate>
  );
}
