import { Outlet } from 'react-router';

export default function CompanyBookingProfileDailyScheduleLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-medium">Timeplan</h4>
      </div>
      <Outlet />
    </div>
  );
}