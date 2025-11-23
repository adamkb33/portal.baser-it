import { Outlet, useOutletContext } from 'react-router';
import type { ServicesOutletContext } from '../../layout';

export default function AppointmentsContactFormServicesEmployeeTimeLayout() {
  const parentContext = useOutletContext<ServicesOutletContext>();

  return <Outlet context={parentContext} />;
}
