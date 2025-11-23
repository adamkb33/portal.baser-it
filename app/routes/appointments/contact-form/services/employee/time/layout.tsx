import { Outlet, useOutletContext } from 'react-router';
import type { AppointmentsOutletContext } from '~/routes/appointments/layout';

export default function AppointmentsContactFormServicesEmployeeTimeLayout() {
  const parentContext = useOutletContext<AppointmentsOutletContext>();

  return <Outlet context={parentContext} />;
}
