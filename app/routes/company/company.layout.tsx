import { Outlet, useOutletContext } from 'react-router';
import type { RootOutletContext } from '~/root';

export default function CompanyLayout() {
  const context = useOutletContext<RootOutletContext>();

  return <Outlet context={context} />;
}
