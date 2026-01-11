import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData, Link } from 'react-router';
import type { BookingProfileDto } from 'tmp/openapi/gen/booking';
import type { ApiClientError } from '~/api/clients/http';
import { AppointmentSessionStepId, type AppointmentSessionDto } from '~/api/clients/types';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';
import { ROUTES_MAP } from '~/lib/route-tree';
import {
  BookingContainer,
  BookingPageHeader,
  BookingGrid,
  BookingSection,
  BookingButton,
} from '../../_components/booking-layout';

export type AppointmentsEmployeeLoaderData = {
  session: AppointmentSessionDto;
  profiles: BookingProfileDto[];
  selectedProfileId?: number;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    if (
      !session.steps?.some((step) => step.appointmentSessionStepId === AppointmentSessionStepId.SELECT_PROFILE) &&
      session.selectedProfileId
    ) {
      return redirect(ROUTES_MAP['booking.public.appointment.session.select-services'].href);
    }

    const profilesResponse =
      await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.getAppointmentSessionProfiles(
        {
          sessionId: session.sessionId,
        },
      );

    return data<AppointmentsEmployeeLoaderData>({
      session,
      profiles: profilesResponse.data || [],
      selectedProfileId: session.selectedProfileId,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    if (error as ApiClientError) {
      return { error: (error as ApiClientError).body.message };
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return ROUTES_MAP['booking.public.appointment'].href;
    }

    const formData = await request.formData();
    const selectedProfileId = formData.get('selectedProfileId') as string;

    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.selectAppointmentSessionProfile(
      {
        sessionId: session.sessionId,
        selectedProfileId: Number(selectedProfileId),
      },
    );

    return redirect(ROUTES_MAP['booking.public.appointment.session.select-services'].href);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AppointmentsEmployee() {
  const { profiles, selectedProfileId } = useLoaderData<AppointmentsEmployeeLoaderData>();
  console.log(profiles);

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
              className={isSelected ? 'border-primary' : ''}
            >
              <div className="flex gap-3">
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

              {profile.services && profile.services.length > 0 && (
                <div className="border-t border-border pt-4 space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Tjenester
                  </span>
                  <div className="space-y-2">
                    {profile.services.map((service) => (
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
              )}

              <div className="border-t border-border pt-4">
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
