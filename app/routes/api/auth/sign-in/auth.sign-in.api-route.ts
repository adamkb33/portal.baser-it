import { data } from 'react-router';
import type { Route } from './+types/auth.sign-in.api-route';
import { AuthController } from '~/api/generated/identity';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService } from '~/lib/auth-service';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const provider = String(formData.get('provider') || 'LOCAL');
  const idToken = String(formData.get('idToken') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const isGoogleLogin = provider === 'GOOGLE';

  if (isGoogleLogin && !idToken) {
    return data({ error: 'Kunne ikke logge inn med Google. Prøv igjen.' }, { status: 400 });
  }

  try {
    const response = await AuthController.signIn({
      body: isGoogleLogin ? { provider: 'GOOGLE', idToken } : { provider: 'LOCAL', email, password },
    });
    const tokens = response.data?.data;

    if (!tokens) {
      const message = response.data?.message || 'Kunne ikke logge inn. Prøv igjen.';
      return data({ error: message }, { status: 400 });
    }

    const headers = await authService.setAuthCookies(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.accessTokenExpiresAt,
      tokens.refreshTokenExpiresAt,
    );

    return data({ success: true }, { headers });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke logge inn. Prøv igjen.');
    return data({ error: message }, { status: status ?? 400 });
  }
}
