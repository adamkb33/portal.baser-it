import * as React from 'react';
import { useFetcher, useLocation } from 'react-router';

type AuthSignUpFetcherFormProps = {
  fetcherId: string;
  className?: string;
  children: React.ReactNode;
};

export function AuthSignUpFetcherForm({ fetcherId, className, children }: AuthSignUpFetcherFormProps) {
  const fetcher = useFetcher({ key: fetcherId });
  const location = useLocation();
  const action = `${location.pathname}${location.search}`;

  return (
    <fetcher.Form method="post" action={action} className={className}>
      {children}
    </fetcher.Form>
  );
}
