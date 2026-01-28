import { Outlet } from 'react-router';
import { BookingContainer } from '../../_components/booking-layout';
import { ClearSessionAction } from './_components/clear-session-action';
import { useContactLoaderData } from './_utils/contact-loader-data';

export default function BookingPublicAppointmentSessionContactLayout() {
  const loaderData = useContactLoaderData();
  const clearSessionAction = loaderData?.session?.userId ? <ClearSessionAction /> : null;

  return (
    <BookingContainer>
      <Outlet />
      {clearSessionAction ? <div className="pt-2">{clearSessionAction}</div> : null}
    </BookingContainer>
  );
}
