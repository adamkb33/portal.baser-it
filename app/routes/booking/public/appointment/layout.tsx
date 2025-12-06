import { Outlet } from 'react-router';

export default function AppointmentsLayout() {
  return (
    <div className="flex">
      <div className="flex-1 border border-border bg-background shadow-[8px_8px_0px_0px_rgb(120,40,180)]">
        <div className="sm:p-8 lg:p-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
