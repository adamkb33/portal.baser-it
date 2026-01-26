import * as React from 'react';
import { useFetcher } from 'react-router';
import { ROUTES_MAP } from '~/lib/route-tree';

type AuthSignUpFetcherFormProps = {
  fetcherId: string;
  className?: string;
  children: React.ReactNode;
};

export function AuthSignUpFetcherForm({ fetcherId, className, children }: AuthSignUpFetcherFormProps) {
  const fetcher = useFetcher({ key: fetcherId });
  const returnToValue = ROUTES_MAP['booking.public.appointment.session.contact'].href;
  const action = `${ROUTES_MAP['auth.sign-up'].href}?index&returnTo=${encodeURIComponent(returnToValue)}`;

  return (
    <fetcher.Form method="post" action={action} className={className}>
      {children}
    </fetcher.Form>
  );
}
