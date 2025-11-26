import { useOutletContext } from 'react-router';
import type { AppointmentsLayoutLoaderData } from './layout';

export default function AppointmentsSelectServices() {
  const context = useOutletContext<AppointmentsLayoutLoaderData>();

  return <div>{context.session?.sessionId}</div>;
}
