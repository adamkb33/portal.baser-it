import { Outlet } from 'react-router';

export default function CompanyBookingAdminAppointmentsLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Time Bestillinger</h3>
      </div>
      <Outlet />
    </div>
  );
}