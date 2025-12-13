import { Outlet } from 'react-router';

export default function CompanyBookingAdminSettingsLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Booking Instillinger</h3>
      </div>
      <Outlet />
    </div>
  );
}