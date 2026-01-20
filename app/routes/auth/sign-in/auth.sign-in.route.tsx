// auth.sign-in.route.tsx
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.sign-in.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { AuthController } from '~/api/generated/identity';
import { apiRouteHandler,  type RouteData } from '~/lib/api-route-handler';

export const action = apiRouteHandler.action(async ({ request }, { requestApi }) => {
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const tokens = await requestApi(
    AuthController.signIn({
      body: { email, password },
    }),
  );

  if (!tokens) {
    return data<RouteData<Record<string, never>, { values: { email: string } }>>(
      {
        ok: false,
        error: { message: 'Ugyldig e-post eller passord' },
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

  return redirect('/', {
    headers: [
      ['Set-Cookie', accessCookie],
      ['Set-Cookie', refreshCookie],
    ],
  });
}, { fallbackMessage: 'Kunne ikke logge inn. Prøv igjen.' });

export default function AuthSignIn({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const actionHasOk = !!actionData && 'ok' in actionData;
  const errorMessage = actionHasOk && !actionData.ok ? actionData.error.message : undefined;
  const actionValues =
    actionHasOk && !actionData.ok && 'values' in actionData
      ? (actionData as { values?: { email?: string } }).values
      : undefined;

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
