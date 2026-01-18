import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData, Link } from 'react-router';
import { getSession } from '~/lib/appointments.server';
import { type ActionFunctionArgs } from 'react-router';
import { ROUTES_MAP } from '~/lib/route-tree';
import { handleRouteError, type RouteData } from '~/lib/api-error';
import {
  BookingContainer,
  BookingPageHeader,
  BookingGrid,
  BookingSection,
  BookingButton,
} from '../../_components/booking-layout';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { PublicAppointmentSessionController, type AppointmentSessionDto, type BookingProfileDto } from '~/api/generated/booking';

export type AppointmentsEmployeeLoaderData = RouteData<{
  session: AppointmentSessionDto;
  profiles: BookingProfileDto[];
  selectedProfileId?: number;
}>;

export async function loader(args: LoaderFunctionArgs) {
  try {
    const session = await getSession(args.request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    if (
      !session.steps?.some((step) => step.appointmentSessionStepId === 'SELECT_PROFILE') &&
      session.selectedProfileId
    ) {
      return redirect(ROUTES_MAP['booking.public.appointment.session.select-services'].href);
    }

    const profilesResponse =
      await PublicAppointmentSessionController.getAppointmentSessionProfiles(
        {
          query: {
            sessionId: session.sessionId,
          },
        },  
      );

    return data<AppointmentsEmployeeLoaderData>({
      ok: true,
      session,
      profiles: profilesResponse.data?.data || [],
      selectedProfileId: session.selectedProfileId,
    });
  } catch (error: any) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke hente frisører' });
  }
}

export async function action(args: ActionFunctionArgs) {
  try {
    const session = await getSession(args.request);

    if (!session) {
      return ROUTES_MAP['booking.public.appointment'].href;
    }

    const formData = await args.request.formData();
    const selectedProfileId = formData.get('selectedProfileId') as string;

    await PublicAppointmentSessionController.selectAppointmentSessionProfile(
      {
        query: {
          sessionId: session.sessionId,
          selectedProfileId: Number(selectedProfileId),
        },
      },
    );

    return redirect(ROUTES_MAP['booking.public.appointment.session.select-services'].href);
  } catch (error: any) {
    return handleRouteError(error, args, { fallbackMessage: 'Kunne ikke velge frisør' });
  }
}

export default function AppointmentsEmployee() {
  const loaderData = useLoaderData<AppointmentsEmployeeLoaderData>();
  const profiles = loaderData.ok ? loaderData.profiles : [];
  const selectedProfileId = loaderData.ok ? loaderData.selectedProfileId : undefined;

  if (!loaderData.ok) {
    return (
      <BookingContainer>
        <BookingPageHeader title="Velg frisør" description={loaderData.error.message} />
      </BookingContainer>
    );
  }

  return (
    <BookingContainer>
      <BookingPageHeader
        title="Velg frisør"
        description={
          selectedProfileId
            ? 'Du har allerede valgt en frisør. Du kan endre valget eller fortsette.'
            : 'Velg en frisør for å fortsette med timebestilling'
        }
      />

      <BookingGrid cols={2}>
        {profiles.map((profile) => {
          const isSelected = selectedProfileId === profile.id;

          return (
            <BookingSection
              key={profile.id}
              label={isSelected ? 'Valgt frisør' : undefined}
              className={[
                'flex h-full min-h-[260px] flex-col',
                isSelected ? 'border-primary' : '',
              ].join(' ')}
            >
              <div className="flex min-h-[84px] items-start gap-3">
                {profile.image && (
                  <div className="border border-border bg-muted w-16 h-16 flex-shrink-0">
                    <img
                      src={profile.image.url}
                      alt={`${profile.givenName} ${profile.familyName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    {profile.givenName} {profile.familyName}
                  </h2>
                  {profile.description && <p className="text-xs text-muted-foreground mt-1">{profile.description}</p>}
                </div>
              </div>

              <div className="border-t border-border py-4">
                {profile.services.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Vis tjenester
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 rounded-none border border-border bg-background p-4">
                      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                        {profile.services.map((group) => (
                          <div key={group.id} className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {group.name}
                            </div>
                            <div className="space-y-2">
                              {group.services.map((service) => (
                                <div key={service.id} className="flex items-baseline justify-between gap-2">
                                  <span className="text-sm text-foreground">{service.name}</span>
                                  <div className="flex items-baseline gap-2 flex-shrink-0">
                                    <span className="text-xs text-muted-foreground">{service.duration} min</span>
                                    <span className="text-sm font-medium text-foreground">{service.price} kr</span>
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
              </div>

              <div className="mt-auto border-t border-border pt-4">
                {isSelected ? (
                  <Link to={ROUTES_MAP['booking.public.appointment.session.select-services'].href}>
                    <BookingButton variant="primary" fullWidth>
                      Fortsett med {profile.givenName}
                    </BookingButton>
                  </Link>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="selectedProfileId" value={profile.id} />
                    <BookingButton type="submit" fullWidth>
                      Velg {profile.givenName}
                    </BookingButton>
                  </Form>
                )}
              </div>
            </BookingSection>
          );
        })}
      </BookingGrid>
    </BookingContainer>
  );
}
