import * as React from 'react';
import { useFetcher, useLocation } from 'react-router';
import { ROUTES_MAP } from '~/lib/route-tree';

type AuthSignInFetcherFormProps = {
  fetcherId: string;
  returnTo?: string;
  className?: string;
  children: React.ReactNode;
};

export function AuthSignInFetcherForm({ fetcherId, returnTo, className, children }: AuthSignInFetcherFormProps) {
  const fetcher = useFetcher({ key: fetcherId });
  const location = useLocation();
  const returnToValue = returnTo ?? `${location.pathname}${location.search}`;
  const action = `${ROUTES_MAP['auth.sign-in'].href}?index&returnTo=${encodeURIComponent(returnToValue)}`;

  return (
    <fetcher.Form method="post" action={action} className={className}>
      {children}
    </fetcher.Form>
  );
}
