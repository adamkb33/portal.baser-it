import { Outlet } from 'react-router';

export default function CompanyBookingAdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Booking Administrasjon</h2>
      </div>
      <Outlet />
    </div>
  );
}