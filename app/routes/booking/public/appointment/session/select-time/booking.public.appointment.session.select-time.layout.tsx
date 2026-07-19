import { Outlet } from 'react-router';
import { logger } from '~/lib/logger';

export async function action({ request }: { request: Request }) {
  const url = new URL(request.url);
  const formData = await request
    .clone()
    .formData()
    .then((data) => Object.fromEntries(data.entries()))
    .catch(() => null);

  logger.error('[booking:select-time:layout-action] Unexpected layout action hit', {
    method: request.method,
    url: request.url,
    path: url.pathname,
    search: url.search,
    formData,
    note: 'POST reached select-time layout instead of select-time route action',
  });

  return null;
}

export default function SelectTimeLayout() {
  return <Outlet />;
}
