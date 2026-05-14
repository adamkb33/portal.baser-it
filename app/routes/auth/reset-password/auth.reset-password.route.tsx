// auth.reset-password.route.tsx (refactored)
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.reset-password.route';

import { decodeResetPasswordToken } from './_utils/auth.reset-password.utils';
import { AuthController } from '~/api/generated/base';
import { authService } from '~/lib/auth-service';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError } from '~/lib/flash-message.server';
import { Button, FormField, FormPageTemplate } from '~/ui';

function toMessageValue(message: unknown, fallback: string) {
  if (typeof message === 'string' && message.trim().length > 0) return message;
  if (message && typeof message === 'object') {
    const candidate = (message as { value?: string; id?: string }).value || (message as { id?: string }).id;
    if (candidate) return candidate;
  }
  return fallback;
}

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
  const currentHref = new URL(request.url);
  const currentPath = `${currentHref.pathname}${currentHref.search}`;
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
      const message = toMessageValue(response.data?.message, 'Noe gikk galt. Prøv igjen.');
      return redirectWithError(request, currentPath, message);
    }

    const { headers } = await authService.processTokenRefresh({
      accessToken: response.data.data.accessToken,
      refreshToken: response.data.data.refreshToken,
      accessTokenExpiresAt: response.data.data.accessTokenExpiresAt,
      refreshTokenExpiresAt: response.data.data.refreshTokenExpiresAt,
    });

    return redirect('/', { headers });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Noe gikk galt. Prøv igjen.');
    return redirectWithError(request, currentPath, message);
  }
}

export default function AuthResetPassword({ loaderData }: Route.ComponentProps) {
  const { resetPasswordToken, email } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  return (
    <FormPageTemplate
      title="Tilbakestill passord"
      description="Opprett et nytt passord for din konto."
      variant="emphasis"
      actions={
        <Link to="/" className="mt-2 block text-center text-sm font-medium text-foreground hover:underline">
          Tilbake til forsiden →
        </Link>
      }
      footerLink={null}
    >
      <Form method="post" className="space-y-6">
        <input type="hidden" name="resetPasswordToken" value={resetPasswordToken} />

        <FormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          defaultValue={email}
          disabled
        />

        <FormField
          id="password"
          name="password"
          label="Passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          label="Bekreft passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Tilbakestill passord
        </Button>
      </Form>
    </FormPageTemplate>
  );
}
