import { Outlet } from 'react-router';

export default function CompanyBookingAdminAppointmentsCreateLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-medium">Bestill Ny Time</h4>
      </div>
      <Outlet />
    </div>
  );
}