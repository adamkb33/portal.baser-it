import { Outlet } from 'react-router';

export default function AppointmentsLayout() {
  return (
    <div className="">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </div>
    </div>
  );
}
