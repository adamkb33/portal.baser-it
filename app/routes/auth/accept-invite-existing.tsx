import * as React from 'react';
import { Link, redirect, useFetcher, useLoaderData, type ActionFunctionArgs } from 'react-router';
import { Button } from '~/components/ui/button';
import type { Route } from '../+types/home';
import { AuthControllerService } from '~/api/clients/base';
import { OpenAPI, ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { accessTokenCookie, refreshTokenCookie } from '~/features/auth/api/cookies.server';
import { toAuthTokens } from '~/features/auth/token/token-utils';
import { baseApi } from '~/lib/utils';

interface LoaderData {
  inviteToken: string;
}

export async function action({ request }: ActionFunctionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const formData = await request.formData();
  const inviteToken = formData.get('inviteToken') as string;
  const hasAccepted = formData.get('hasAccepted') === 'true';

  try {
    const response = await baseApi().AuthControllerService.AuthControllerService.acceptInviteExisting({
      inviteToken: inviteToken,
      requestBody: {
        hasAccepted: hasAccepted,
      },
    });

    if (!response.success || !response.data) {
      throw new Error();
    }

    const tokens = toAuthTokens(response.data);

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    return redirect('/', {
      headers: [
        ['Set-Cookie', accessCookie],
        ['Set-Cookie', refreshCookie],
      ],
    });
  } catch (error: any) {
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('token');

  if (!inviteToken) {
    return redirect('/');
  }

  return { inviteToken };
}

export default function AuthAcceptInviteExisting() {
  const { inviteToken } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;
  const inviteInvalid = Boolean(actionData?.inviteInvalid);

  const handleAccept = React.useCallback(() => {
    const payload = new FormData();
    payload.set('inviteToken', inviteToken);
    payload.set('hasAccepted', 'true');

    fetcher.submit(payload, {
      method: 'post',
      action: '/auth/accept-invite/existing',
    });
  }, [fetcher, inviteToken]);

  const handleDecline = React.useCallback(() => {
    // Optionally redirect or show a decline message
    window.location.href = '/';
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Company Invitation</h1>
        <p className="text-muted-foreground text-sm">
          You've been invited to join a company. Accept the invitation to gain access.
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

      {inviteInvalid ? (
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Invite expired</h2>
          <p className="text-sm text-muted-foreground">
            {actionData?.formError ??
              'This invitation link is no longer valid. Please request a new invite from your administrator.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-md border bg-card p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Review Invitation</h2>
            <p className="text-sm text-muted-foreground">
              By accepting this invitation, you'll be added to the company and granted the assigned roles.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={handleAccept} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            <Button type="button" variant="outline" onClick={handleDecline} disabled={isSubmitting}>
              Decline
            </Button>
          </div>
        </div>
      )}

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}
