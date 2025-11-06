import { Outlet } from 'react-router';

export default function CompanyEmployeesLayout() {
  return (
    <div className="flex flex-col gap-4">
      <Outlet />
    </div>
  );
}
