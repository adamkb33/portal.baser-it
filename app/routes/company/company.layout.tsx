import { Outlet, useOutletContext } from 'react-router';
import type { RootOutletContext } from '~/root';

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return (
    <div className="bg-white rounded-lg border p-6">
      <Outlet context={context} />
    </div>
  );
}
