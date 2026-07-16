import { Form, data, redirect, useNavigation } from 'react-router';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { BookingCompanyBadge } from '~/routes/booking/public/_components/booking-company-badge';
import { getBookingCompanySummary } from '~/routes/booking/public/_utils/booking-company.server';
import { withBookingBackendCall, withBookingFlowLog } from '~/routes/booking/public/_utils/booking-flow-log.server';
import { requireBookingSession } from '~/routes/booking/public/_utils/booking.require-authenticated-flow.server';
import { getBookingRouteMap } from '~/routes/booking/public/_utils/booking.route-map';
import { BookingBottomActionBar } from '~/routes/booking/public/_components/bottom-nav';
import {
  BookingStepTemplate,
  Button,
  Card,
  CardContent,
  CardFooter,
  Grid,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  Notice,
  cn,
} from '~/ui';
import type { Route } from './+types/booking.public.appointment.session.employee.route';

const ROUTE_ID = 'booking.public.appointment.session.employee';

export async function loader({ request }: Route.LoaderArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'loader', step: 'employee' }, async () => {
    return employeeLoader({ request } as Route.LoaderArgs);
  });
}

async function employeeLoader({ request }: Route.LoaderArgs) {
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
      navigation: {
        contact: routes.contact,
        selectServices: routes.selectServices,
      },
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente frisører');
    return data({
      session: null,
      profiles: [],
      selectedProfileId: null,
      companySummary: null,
      error: message,
      navigation: {
        contact: routes.contact,
        selectServices: routes.selectServices,
      },
    });
  }
}

export async function action({ request }: Route.ActionArgs) {
  return withBookingFlowLog({ request, routeId: ROUTE_ID, kind: 'action', step: 'employee' }, async () => {
    return employeeAction({ request } as Route.ActionArgs);
  });
}

async function employeeAction({ request }: Route.ActionArgs) {
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
}

export default function BookingEmployeePage({ loaderData }: Route.ComponentProps) {
  const profiles = loaderData.profiles ?? [];
  const selectedProfileId = loaderData.selectedProfileId;
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
            <Card
              key={profile.id}
              variant="default"
              className={cn(
                'group flex h-full min-h-64 flex-col border-booking-border bg-booking-surface-subtle shadow-[var(--shadow-booking-card)] transition-colors focus-within:ring-[length:var(--border-booking-focus-ring)] focus-within:ring-booking-action',
                isSelected
                  ? 'border-booking-action bg-booking-action-muted ring-[length:var(--border-booking-focus-ring)] ring-booking-action/35'
                  : 'hover:border-booking-action/20 hover:bg-booking-surface-muted',
                isSubmittingProfile && 'opacity-80',
              )}
            >
              <div className="mb-4 space-y-2">
                {isSelected ? (
                  <Text as="p" variant="overline" className="text-booking-action">
                    Valgt behandler
                  </Text>
                ) : null}
                <div className="flex min-h-20 items-start gap-3 rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-strong p-3">
                  {profile.image ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-booking-field)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised">
                      <img
                        src={profile.image.url}
                        alt={`${profile.givenName} ${profile.familyName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Text as="h3" variant="heading-sm" className="text-booking-text">
                      {profile.givenName} {profile.familyName}
                    </Text>
                    {profile.description ? (
                      <Text className="mt-1 text-booking-text-muted">{profile.description}</Text>
                    ) : null}
                  </div>
                </div>
              </div>

              <CardContent className="flex-1">
                {profile.services.length > 0 && (
                  <div className="rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-subtle p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Text as="p" variant="caption" className="uppercase tracking-wide text-booking-text-muted">
                        Tjenester
                      </Text>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="booking-ghost"
                            size="sm"
                            className="h-8 px-2 text-xs hover:bg-booking-surface-raised"
                          >
                            Vis alle
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 border-booking-border bg-booking-surface-muted p-4">
                          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                            {profile.services.map((group) => (
                              <div
                                key={group.id}
                                className="space-y-2 rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-subtle p-3"
                              >
                                <div className="text-xs font-semibold uppercase tracking-wide text-booking-text-muted">
                                  {group.name}
                                </div>
                                <div className="space-y-2">
                                  {group.services.map((service) => (
                                    <div
                                      key={service.id}
                                      className="flex items-baseline justify-between gap-2 rounded-[var(--radius-booking-field)] bg-booking-surface-strong px-2 py-1.5"
                                    >
                                      <span className="text-sm text-booking-text">{service.name}</span>
                                      <div className="flex flex-shrink-0 items-baseline gap-2">
                                        <span className="text-xs text-booking-text-muted">{service.duration} min</span>
                                        <span className="text-sm font-medium text-booking-text">
                                          {service.price} kr
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Text as="p" variant="body-sm" className="text-booking-text-muted">
                      {profile.services.reduce((sum, group) => sum + group.services.length, 0)} tjenester tilgjengelig
                    </Text>
                  </div>
                )}
              </CardContent>

              <CardFooter className="mt-auto border-t border-booking-border bg-booking-surface-strong p-3">
                {isSelected ? (
                  <Button
                    type="button"
                    variant="booking-secondary"
                    fullWidth
                    disabled
                    className="gap-2 border-booking-action/40 bg-booking-surface-raised text-booking-text"
                  >
                    Valgt
                  </Button>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="selectedProfileId" value={profile.id} />
                    <Button
                      type="submit"
                      variant="booking-primary"
                      fullWidth
                      loading={isSubmittingProfile}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      Velg {profile.givenName}
                    </Button>
                  </Form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </Grid>
      <BookingBottomActionBar
        actions={[
          {
            id: 'back',
            type: 'link',
            to: loaderData.navigation.contact,
            label: 'Tilbake',
            variant: 'secondary',
            disabled: isSubmitting,
          },
          {
            id: 'continue',
            type: 'link',
            to: loaderData.navigation.selectServices,
            label: selectedProfileId ? 'Fortsett' : 'Velg behandler',
            variant: 'primary',
            disabled: !selectedProfileId || isSubmitting,
          },
        ]}
        compact
      />
    </BookingStepTemplate>
  );
}
