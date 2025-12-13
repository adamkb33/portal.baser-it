import { Outlet } from 'react-router';

export default function CompanyBookingProfileLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Min Profil</h3>
      </div>
      <Outlet />
    </div>
  );
}