import * as React from 'react';
import { Link, redirect, useFetcher, useLoaderData, useNavigate } from 'react-router';

import { AcceptInviteForm } from '@/components/forms/accept-invite-form';
import { type AcceptInviteSchema } from '@/features/auth/schemas/accept-invite';
import { acceptInvite } from '@/features/auth/api/accept-invite.server';
import type { Route } from '../+types/home';

interface LoaderData {
  inviteToken: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('token');

  if (!inviteToken) {
    return redirect('/');
  }

  return { inviteToken };
}

export const action = acceptInvite;

export default function AuthAcceptInvite() {
  const { inviteToken } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;
  const inviteInvalid = Boolean(actionData?.inviteInvalid);

  const handleSubmit = React.useCallback(
    (values: AcceptInviteSchema) => {
      const payload = new FormData();
      payload.set('inviteToken', inviteToken);
      payload.set('givenName', values.givenName);
      payload.set('familyName', values.familyName);
      payload.set('password', values.password);
      payload.set('confirmPassword', values.confirmPassword);

      fetcher.submit(payload, {
        method: 'post',
        action: '/auth/accept-invite',
      });
    },
    [fetcher, inviteToken],
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Complete your account</h1>
        <p className="text-muted-foreground text-sm">Set up your profile and password to activate your access.</p>
      </header>

      {actionData?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      {inviteInvalid ? (
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Invite expired</h2>
          <p className="text-sm text-muted-foreground">
            {actionData?.formError ??
              'This invitation link is no longer valid. Please request a new invite from your administrator.'}
          </p>
        </div>
      ) : (
        <AcceptInviteForm
          inviteToken={inviteToken}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialValues={actionData?.values}
        />
      )}

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}
