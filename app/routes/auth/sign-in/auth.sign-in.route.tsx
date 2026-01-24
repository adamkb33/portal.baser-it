// auth.sign-in.route.tsx
import * as React from 'react';
import { Form, Link, redirect, data, useFetcher, useLocation, useNavigation } from 'react-router';
import type { Route } from './+types/auth.sign-in.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { GoogleSignInButton } from './_components/google-sign-in-button';
import { AuthController } from '~/api/generated/identity';
import { resolveErrorPayload } from '~/lib/api-error';
import { ENV } from '~/api/config/env';

const googleClientId = ENV.GOOGLE_CLIENT_ID;

function getReturnTo(url: URL) {
  const returnToParam = url.searchParams.get('returnTo');
  return returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//') ? returnToParam : '/';
}

function getErrorMessage(rawError: unknown) {
  if (typeof rawError === 'string') {
    return rawError;
  }
  if (!rawError || typeof rawError !== 'object') {
    return undefined;
  }
  const error = rawError as { value?: string; id?: string };
  if (typeof error.value === 'string') {
    return error.value;
  }
  if (typeof error.id === 'string') {
    return error.id;
  }
  return undefined;
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const returnTo = getReturnTo(url);
  const formData = await request.formData();
  const provider = String(formData.get('provider') || 'LOCAL');
  const idToken = String(formData.get('idToken') || '');
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const isGoogleLogin = provider === 'GOOGLE';

  if (isGoogleLogin && !idToken) {
    return data(
      {
        error: 'Kunne ikke logge inn med Google. Prøv igjen.',
        values: { email },
      },
      { status: 400 },
    );
  }

  try {
    const response = await AuthController.signIn({
      body: isGoogleLogin ? { provider: 'GOOGLE', idToken } : { provider: 'LOCAL', email, password },
    });
    const tokens = response.data?.data;

    if (!tokens) {
      const message = response.data?.message || 'Kunne ikke logge inn. Prøv igjen.';
      return data(
        {
          error: message,
          values: { email },
        },
        { status: 400 },
      );
    }

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    return redirect(returnTo, {
      headers: [
        ['Set-Cookie', accessCookie],
        ['Set-Cookie', refreshCookie],
      ],
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke logge inn. Prøv igjen.');
    return data(
      {
        error: message,
        values: { email },
      },
      { status: status ?? 400 },
    );
  }
}

export default function AuthSignIn({ actionData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof actionData>();
  const location = useLocation();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isGoogleSubmitting = fetcher.state === 'submitting';
  const rawError = fetcher.data?.error ?? actionData?.error;
  const errorMessage = getErrorMessage(rawError);
  const actionValues = actionData?.values;
  const submitGoogleToken = React.useCallback(
    (token: string) => {
      const formData = new FormData();
      formData.append('provider', 'GOOGLE');
      formData.append('idToken', token);
      fetcher.submit(formData, {
        method: 'post',
        action: `${location.pathname}${location.search}`,
      });
    },
    [fetcher, location.pathname, location.search],
  );

  return (
    <AuthFormContainer
      title="Logg inn"
      description="Logg inn for å administrere ditt selskap og kundeforhold."
      error={errorMessage}
      secondaryAction={
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground">Glemt passordet?</p>
          <Link
            to={ROUTES_MAP['auth.forgot-password'].href}
            className="inline-block text-sm font-medium text-foreground hover:underline"
          >
            Tilbakestill passord →
          </Link>
        </div>
      }
    >
      {googleClientId ? (
        <>
          <GoogleSignInButton onCredential={submitGoogleToken} disabled={isSubmitting || isGoogleSubmitting} />
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-form-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-form-text-muted">Eller</span>
            <span className="h-px flex-1 bg-form-border" />
          </div>
        </>
      ) : null}
      <Form method="post" className="space-y-4 md:space-y-6" aria-busy={isSubmitting}>
        <AuthFormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          placeholder="din@e-post.no"
          defaultValue={actionValues?.email}
          required
          disabled={isSubmitting}
        />

        <AuthFormField
          id="password"
          name="password"
          label="Passord"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />

        <div className="pt-2">
          <AuthFormButton isLoading={isSubmitting} loadingText="Logger inn…">
            Logg inn
          </AuthFormButton>
        </div>
      </Form>
    </AuthFormContainer>
  );
}
