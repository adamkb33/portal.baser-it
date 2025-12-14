import { Outlet } from 'react-router';

export default function CompanyBookingLayout() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <Outlet />
    </div>
  );
}
