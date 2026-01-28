import { Outlet, useMatches } from 'react-router';
import { BookingContainer } from '../../_components/booking-layout';
import { ClearSessionAction } from './_components/clear-session-action';

type ContactLoaderData = {
  session?: { userId?: string | null } | null;
};

export default function BookingPublicAppointmentSessionContactLayout() {
  const matches = useMatches();
  const contactMatch = matches.find(
    (match) => match.handle && typeof match.handle === 'object' && 'contactFlow' in match.handle,
  );
  const loaderData = contactMatch?.data as ContactLoaderData | undefined;
  const clearSessionAction = loaderData?.session?.userId ? <ClearSessionAction /> : null;

  return (
    <BookingContainer>
      <Outlet />
      {clearSessionAction ? <div className="pt-2">{clearSessionAction}</div> : null}
    </BookingContainer>
  );
}
