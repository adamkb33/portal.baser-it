import type { AppointmentSessionDto } from '~/api/generated/booking';

export type ContactLoaderData = {
  session: AppointmentSessionDto | null;
  authSession: {
    accessToken?: string | null;
  } | null;
  sessionUser: {
    nextStep?: string | null;
    userDto?: {
      email?: string | null;
      givenName?: string | null;
      familyName?: string | null;
    } | null;
  } | null;
  error: string | null;
};
