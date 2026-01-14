// auth.reset-password.route.tsx (refactored)
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.reset-password.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { OpenAPI } from '~/api/clients/base/OpenAPI';
import { ENV } from '~/api/config/env';
import { baseApi } from '~/lib/utils';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { toAuthTokens } from '../_utils/token.utils';
import { decodeResetPasswordToken } from './_utils/auth.reset-password.utils';
import type { ApiClientError } from '~/api/clients/http';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { AuthController } from '~/api/generated/identity';
import { authService, AuthService } from '~/lib/auth-service';

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
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

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
    console.error('[reset-password] Error:', error);

    if (error as ApiClientError) {
      const errorMessage = error.body?.message || 'Noe gikk galt. Prøv igjen.';
      const isTokenError =
        errorMessage.toLowerCase().includes('token') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('ugyldig');

      return data(
        {
          error: errorMessage,
          tokenInvalid: isTokenError,
        },
        { status: 400 },
      );
    }

    throw error;
  }
}

export default function AuthResetPassword({ loaderData, actionData }: Route.ComponentProps) {
  const { resetPasswordToken, email } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Show token invalid state
  if (actionData?.tokenInvalid) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Ugyldig eller utløpt link</h2>
          <p className="text-sm text-muted-foreground">
            {actionData.error ||
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
      error={actionData?.error && !actionData.tokenInvalid ? actionData.error : undefined}
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
