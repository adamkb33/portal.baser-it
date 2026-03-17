import { data, redirect, Form, Link, useNavigation } from 'react-router';
import type { Route } from './+types/booking.public.appointment.session.employee.route';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import {
  BookingStepTemplate,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Grid,
  Panel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StickySummaryBar,
  Text,
  cn,
} from '~/ui';
import { PublicAppointmentSessionController } from '~/api/generated/booking';
import { requireAuthenticatedBookingFlow } from '../_utils/require-authenticated-booking-flow.server';
import { redirectWithError } from '~/routes/company/_lib/flash-message.server';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const guardResult = await requireAuthenticatedBookingFlow(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }
    const { session } = guardResult;

    // Allow users to return and change their profile selection
    // Don't auto-forward redirect - users should be able to edit previous steps

    const profilesResponse = await PublicAppointmentSessionController.getAppointmentSessionProfiles({
      query: {
        sessionId: session.sessionId,
      },
    });

    return data({
      session,
      profiles: profilesResponse.data?.data || [],
      selectedProfileId: session.selectedProfileId,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente frisører');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment.session.contact'].href, message);
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const guardResult = await requireAuthenticatedBookingFlow(request);
    if (guardResult instanceof Response) {
      return guardResult;
    }
    const { session } = guardResult;

    const formData = await request.formData();
    const selectedProfileId = formData.get('selectedProfileId') as string;

    await PublicAppointmentSessionController.selectAppointmentSessionProfile({
      query: {
        sessionId: session.sessionId,
        selectedProfileId: Number(selectedProfileId),
      },
    });

    return redirect(ROUTES_MAP['booking.public.appointment.session.select-services'].href);
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke velge frisør');
    return redirectWithError(request, ROUTES_MAP['booking.public.appointment.session.employee'].href, message);
  }
}

export default function AppointmentsEmployee({ loaderData }: Route.ComponentProps) {
  const profiles = loaderData.profiles ?? [];
  const selectedProfileId = loaderData.selectedProfileId;
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId);
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
      footer={
        <StickySummaryBar
          title="Valg"
          items={[
            {
              label: 'Valgt behandler',
              value: selectedProfile ? `${selectedProfile.givenName} ${selectedProfile.familyName}` : 'Ikke valgt',
            },
          ]}
          primaryAction={
            selectedProfileId ? (
              <Link to={ROUTES_MAP['booking.public.appointment.session.select-services'].href}>
                <Button variant="primary" size="lg" fullWidth>
                  Fortsett
                </Button>
              </Link>
            ) : (
              <Button variant="primary" size="lg" fullWidth disabled>
                Velg behandler
              </Button>
            )
          }
          secondaryAction={
            <Link to={ROUTES_MAP['booking.public.appointment.session.contact'].href}>
              <Button type="button" variant="outline" size="md" fullWidth>
                Tilbake
              </Button>
            </Link>
          }
        />
      }
    >
      <Panel>
        <Grid columns={2}>
          {profiles.map((profile) => {
            const isSelected = selectedProfileId === profile.id;
            const isSubmittingProfile =
              isSubmitting && submittingProfileId !== null && String(profile.id) === String(submittingProfileId);

            return (
              <Card
                key={profile.id}
                variant={isSelected || isSubmittingProfile ? 'emphasis' : 'default'}
                className={cn(
                  'flex h-full min-h-[260px] flex-col border-booking-border transition-colors focus-within:ring-2 focus-within:ring-booking-action',
                  isSelected
                    ? 'border-booking-action bg-booking-action/10'
                    : 'bg-booking-surface hover:bg-booking-surface-muted',
                  isSubmittingProfile && 'opacity-80',
                )}
              >
                <CardHeader>
                  {isSelected ? (
                    <Text as="p" variant="overline" className="text-booking-text-muted">
                      Valgt behandler
                    </Text>
                  ) : null}
                  <div className="flex min-h-[84px] items-start gap-3">
                    {profile.image ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-booking-border bg-booking-surface-muted">
                        <img
                          src={profile.image.url}
                          alt={`${profile.givenName} ${profile.familyName}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-booking-text">
                        {profile.givenName} {profile.familyName}
                      </CardTitle>
                      {profile.description ? (
                        <Text className="mt-1 text-booking-text-muted">{profile.description}</Text>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  {profile.services.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="px-0">
                          Vis tjenester
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-4">
                        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                          {profile.services.map((group) => (
                            <div key={group.id} className="space-y-2">
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-booking-text-muted">
                                {group.name}
                              </div>
                              <div className="space-y-2">
                                {group.services.map((service) => (
                                  <div key={service.id} className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm text-booking-text">{service.name}</span>
                                    <div className="flex items-baseline gap-2 flex-shrink-0">
                                      <span className="text-xs text-booking-text-muted">{service.duration} min</span>
                                      <span className="text-sm font-medium text-booking-text">{service.price} kr</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </CardContent>

                <CardFooter className="mt-auto">
                  {isSelected ? (
                    <Button type="button" variant="outline" fullWidth disabled className="gap-2">
                      Valgt
                    </Button>
                  ) : (
                    <Form method="post">
                      <input type="hidden" name="selectedProfileId" value={profile.id} />
                      <Button
                        type="submit"
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
      </Panel>
    </BookingStepTemplate>
  );
}
