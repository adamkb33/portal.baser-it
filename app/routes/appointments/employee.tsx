import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData } from 'react-router';
import type { BookingProfileDto } from 'tmp/openapi/gen/booking';
import type { ApiClientError } from '~/api/clients/http';
import type { AppointmentSessionDto } from '~/api/clients/types';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';

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
      return redirect('/appointments');
    }
    const profilesResponse =
      await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.getAppointmentSessionProfiles(
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
      return redirect('/appointments');
    }

    const formData = await request.formData();
    const selectedProfileId = formData.get('selectedProfileId') as string;

    await bookingApi().PublicAppointmentControllerService.PublicAppointmentControllerService.selectAppointmentSessionProfile(
      {
        sessionId: session.sessionId,
        selectedProfileId: Number(selectedProfileId),
      },
    );

    return redirect('/appointments/select-services');
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

  return (
    <div className="space-y-5">
      <div className="border-b border-border pb-4">
        <h1 className="text-base font-semibold text-foreground">Velg frisør</h1>
        <p className="text-[0.7rem] text-muted-foreground mt-1">
          {selectedProfileId
            ? 'Du har allerede valgt en frisør. Du kan endre valget eller fortsette.'
            : 'Velg en frisør for å fortsette med timebestilling'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => {
          const isSelected = selectedProfileId === profile.id;

          return (
            <div
              key={profile.id}
              className={`border p-4 sm:p-5 space-y-4 ${
                isSelected ? 'border-primary bg-background' : 'border-border bg-background'
              }`}
            >
              {isSelected && (
                <div className="border-b border-border pb-3">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-primary">Valgt frisør</span>
                </div>
              )}

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
                <Form method="post">
                  <input type="hidden" name="selectedProfileId" value={profile.id} />
                  <button
                    type="submit"
                    className={`w-full border px-3 py-2 text-xs font-medium rounded-none ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-foreground text-background'
                    }`}
                  >
                    {isSelected ? 'Fortsett med ' : 'Velg '}
                    {profile.givenName}
                  </button>
                </Form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
