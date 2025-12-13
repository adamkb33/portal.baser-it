import { Outlet } from 'react-router';

export default function CompanyBookingLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Booking</h1>
      </div>
      <Outlet />
    </div>
  );
}