// auth.reset-password.route.tsx (refactored)
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.reset-password.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { ENV } from '~/api/config/env';
import { decodeResetPasswordToken } from './_utils/auth.reset-password.utils';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { AuthController } from '~/api/generated/identity';
import { authService } from '~/lib/auth-service';
import { getRouteError, type RouteData } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const resetPasswordToken = url.searchParams.get('token');

  if (!resetPasswordToken) {
    throw redirect('/');
  }

  const decodedToken = decodeResetPasswordToken(resetPasswordToken);
  if (!decodedToken || !decodedToken.email) {
    throw redirect('/');
  }

  return { resetPasswordToken, email: decodedToken.email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const resetPasswordToken = String(formData.get('resetPasswordToken'));
  const password = String(formData.get('password'));
  const confirmPassword = String(formData.get('confirmPassword'));

  try {
    const response = await AuthController.resetPassword({
      body: {
        resetPasswordToken,
        password,
        password2: confirmPassword,
      },
    });

    if (!response.data || !response.data.data) {
      return data(
        {
          error: 'Token er ikke gyldig',
          tokenInvalid: true,
        },
        { status: 400 },
      );
    }

    const { headers } = await authService.processTokenRefresh({
      accessToken: response.data.data.accessToken,
      refreshToken: response.data.data.refreshToken,
      accessTokenExpiresAt: response.data.data.accessTokenExpiresAt,
      refreshTokenExpiresAt: response.data.data.refreshTokenExpiresAt,
    });

    return redirect('/', { headers });
  } catch (error: any) {
    const { payload, status } = getRouteError(error, { fallbackMessage: 'Noe gikk galt. Prøv igjen.' });
    const message = payload.message.toLowerCase();
    const isTokenError =
      message.includes('token') ||
      message.includes('expired') ||
      message.includes('invalid') ||
      message.includes('ugyldig');

    return data<RouteData<Record<string, never>, { tokenInvalid: boolean }>>(
      {
        ok: false,
        error: payload,
        tokenInvalid: isTokenError,
      },
      { status },
    );
  }
}

export default function AuthResetPassword({ loaderData, actionData }: Route.ComponentProps) {
  const { resetPasswordToken, email } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const actionHasOk = !!actionData && 'ok' in actionData;
  const tokenInvalid = actionData?.tokenInvalid ?? false;
  const errorMessage = actionHasOk
    ? actionData.ok
      ? undefined
      : actionData.error.message
    : actionData?.error;

  // Show token invalid state
  if (tokenInvalid) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Ugyldig eller utløpt link</h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage ||
              'Denne tilbakestillingslinken er ikke lenger gyldig. Vennligst be om en ny tilbakestilling av passord.'}
          </p>
          <Link to={ROUTES_MAP['auth.forgot-password'].href} className="mt-2 inline-block text-primary hover:underline">
            Be om ny tilbakestillingslink
          </Link>
        </div>

        <div className="text-center text-sm">
          <Link to="/" className="text-primary hover:underline">
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthFormContainer
      title="Tilbakestill passord"
      description="Opprett et nytt passord for din konto."
      error={errorMessage && !tokenInvalid ? errorMessage : undefined}
      secondaryAction={
        <Link to="/" className="mt-2 block text-center text-sm font-medium text-foreground hover:underline">
          Tilbake til forsiden →
        </Link>
      }
    >
      <Form method="post" className="space-y-6">
        <input type="hidden" name="resetPasswordToken" value={resetPasswordToken} />

        <AuthFormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          defaultValue={email}
          disabled
        />

        <AuthFormField
          id="password"
          name="password"
          label="Passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <AuthFormField
          id="confirmPassword"
          name="confirmPassword"
          label="Bekreft passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <AuthFormButton isLoading={isSubmitting} loadingText="Tilbakestiller…">
          Tilbakestill passord
        </AuthFormButton>
      </Form>
    </AuthFormContainer>
  );
}
