import * as React from 'react';
import { useFetcher, Link } from 'react-router';

import { SignInForm } from '~/components/forms/sign-in.form';
import { type SignInSchema } from '~/features/auth/schemas/sign-in.schema';

import { signIn } from '@/features/auth/api/sign-in.server';
import { ROUTES_MAP } from '~/lib/nav/route-tree';

export const action = signIn;

export default function AuthSignIn() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;

  const handleSubmit = React.useCallback(
    (values: SignInSchema) => {
      const payload = new FormData();
      payload.set('email', values.email);
      payload.set('password', values.password);

      fetcher.submit(payload, {
        method: 'post',
        action: '/auth/sign-in',
      });
    },
    [fetcher],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Logg inn</h1>
        <p className="text-muted-foreground text-sm">
          Logg inn for å ta i bruk våre tjenester, administrer ditt selskap og ditt kundeforhold.
        </p>
      </header>

      {actionData?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      <SignInForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={actionData?.values} />

      <p className="text-center text-sm text-muted-foreground">
        Har du glemt ditt passord?{' '}
        <Link to={ROUTES_MAP['auth.forgot-password'].href} className="text-primary hover:underline">
          Tilbakestill passordet ditt her.
        </Link>
      </p>

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Tilbake til hovedsiden
        </Link>
      </div>
    </div>
  );
}
