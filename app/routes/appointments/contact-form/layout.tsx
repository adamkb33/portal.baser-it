import { Outlet, useOutletContext } from 'react-router';
import type { AppointmentsOutletContext } from '../layout';

export default function ContactFormLayout() {
  const context = useOutletContext<AppointmentsOutletContext>();
  return <Outlet context={context} />;
}
