import { Outlet } from 'react-router';

export default function BookingPublicAppointmentSessionLayout() {
  return (
    <div className="booking-session-stack">
      <Outlet />
    </div>
  );
}
