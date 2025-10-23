import * as React from 'react';
import { Link, redirect, useFetcher, useLoaderData } from 'react-router';

import { ResetPasswordForm } from '~/components/forms/reset-password.form';
import type { ResetPasswordSchema } from '~/features/auth/schemas/reset-password.schema';
import { decodeResetPasswordToken } from '~/features/auth/token/reset-password-token';
import type { Route } from '../+types/home';
import { ROUTES_MAP } from '~/lib/nav/route-tree';
import { AuthControllerService } from '~/api/clients/identity';
import type { ApiClientError } from '~/api/clients/http';
import { accessTokenCookie, refreshTokenCookie } from '~/features/auth/api/cookies.server';
import { toAuthTokens } from '~/features/auth/token/token-utils';

interface LoaderData {
  resetPasswordToken: string;
  email: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const resetPasswordToken = url.searchParams.get('token');

  if (!resetPasswordToken) {
    return redirect('/');
  }

  const decodedToken = decodeResetPasswordToken(resetPasswordToken);
  if (!decodedToken || !decodedToken.email) {
    return redirect('/');
  }

  return { resetPasswordToken, email: decodedToken.email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  try {
    const response = await AuthControllerService.resetPassword({
      requestBody: {
        resetPasswordToken: formData.get('resetPasswordToken') as string,
        password: formData.get('password') as string,
        password2: formData.get('confirmPassword') as string,
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

export default function AuthResetPassword() {
  const { resetPasswordToken, email } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;
  const tokenInvalid = Boolean(actionData?.tokenInvalid);

  const handleSubmit = React.useCallback(
    (values: ResetPasswordSchema) => {
      const payload = new FormData();
      payload.set('resetPasswordToken', resetPasswordToken);
      payload.set('password', values.password);
      payload.set('confirmPassword', values.confirmPassword);

      fetcher.submit(payload, {
        method: 'post',
        action: '/auth/reset-password',
      });
    },
    [fetcher, resetPasswordToken],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Tilbakestill passord</h1>
        <p className="text-muted-foreground text-sm">Opprett et nytt passord for din konto.</p>
      </header>

      {actionData?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      {tokenInvalid ? (
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Ugyldig eller utløpt link</h2>
          <p className="text-sm text-muted-foreground">
            {actionData?.formError ??
              'Denne tilbakestillingslinken er ikke lenger gyldig. Vennligst be om en ny tilbakestilling av passord.'}
          </p>
          <Link to={ROUTES_MAP['auth.forgot-password'].href} className="text-primary hover:underline inline-block mt-2">
            Be om ny tilbakestillingslink
          </Link>
        </div>
      ) : (
        <ResetPasswordForm
          email={email}
          resetPasswordToken={resetPasswordToken}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          initialValues={actionData?.values}
        />
      )}

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Tilbake til forsiden
        </Link>
      </div>
    </div>
  );
}
