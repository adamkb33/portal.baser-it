// auth.sign-in.route.tsx
import * as React from 'react';
import { Link, useFetcher, useLocation, useNavigate } from 'react-router';
import { API_ROUTES_MAP, ROUTES_MAP } from '~/lib/route-tree';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { GoogleSignInButton } from './_components/google-sign-in-button';
import { ENV } from '~/api/config/env';

const googleClientId = ENV.GOOGLE_CLIENT_ID;

function getReturnToFromSearch(search: string) {
  const returnToParam = new URLSearchParams(search).get('returnTo');
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

export default function AuthSignIn() {
  const fetcher = useFetcher();
  const location = useLocation();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state === 'submitting';
  const rawError =
    typeof fetcher.data === 'object' && fetcher.data && 'error' in fetcher.data ? fetcher.data.error : null;
  const errorMessage = getErrorMessage(rawError);
  const returnTo = React.useMemo(() => getReturnToFromSearch(location.search), [location.search]);
  const action = API_ROUTES_MAP['auth.sign-in'].url;

  React.useEffect(() => {
    if (typeof fetcher.data !== 'object' || !fetcher.data) return;
    const data = fetcher.data as { success?: boolean };
    if (data.success) {
      navigate(returnTo, { replace: true });
    }
  }, [fetcher.data, navigate, returnTo]);
  const submitGoogleToken = React.useCallback(
    (token: string) => {
      const formData = new FormData();
      formData.append('provider', 'GOOGLE');
      formData.append('idToken', token);
      fetcher.submit(formData, {
        method: 'post',
        action,
      });
    },
    [action, fetcher],
  );

  return (
    <AuthFormContainer
      title="Logg inn"
      description="Logg inn for å administrere ditt selskap og kundeforhold."
      error={errorMessage}
      secondaryAction={
        <div className="space-y-3 text-center">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Ny bruker?</p>
            <Link
              to={ROUTES_MAP['auth.sign-up'].href}
              className="inline-block text-sm font-medium text-foreground hover:underline"
            >
              Opprett konto →
            </Link>
          </div>
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
          <GoogleSignInButton onCredential={submitGoogleToken} disabled={isSubmitting} />
          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-form-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-form-text-muted">Eller</span>
            <span className="h-px flex-1 bg-form-border" />
          </div>
        </>
      ) : null}
      <fetcher.Form method="post" action={action} className="space-y-4 md:space-y-6" aria-busy={isSubmitting}>
        <AuthFormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          placeholder="din@e-post.no"
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
      </fetcher.Form>
    </AuthFormContainer>
  );
}
