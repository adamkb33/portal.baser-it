import * as React from 'react';
import { useFetcher, useRevalidator } from 'react-router';
import { API_ROUTES_MAP } from '~/lib/route-tree';

type AuthSignInFetcherFormProps = {
  fetcherId: string;
  className?: string;
  children: React.ReactNode;
};

export function AuthSignInFetcherForm({ fetcherId, className, children }: AuthSignInFetcherFormProps) {
  const fetcher = useFetcher({ key: fetcherId });
  const revalidator = useRevalidator();
  const action = API_ROUTES_MAP['auth.sign-in'].url;

  React.useEffect(() => {
    if (typeof fetcher.data !== 'object' || !fetcher.data) return;
    const data = fetcher.data as { success?: boolean };
    if (data.success) {
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  return (
    <fetcher.Form method="post" action={action} className={className}>
      {children}
    </fetcher.Form>
  );
}
