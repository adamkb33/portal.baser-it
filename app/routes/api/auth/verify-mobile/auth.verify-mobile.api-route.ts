import { data } from 'react-router';
import type { Route } from './+types/auth.verify-mobile.api-route';
import { AuthController } from '~/api/generated/identity';
import { authService } from '~/lib/auth-service';
import { resolveErrorPayload } from '~/lib/api-error';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const verificationSessionToken = String(formData.get('verificationSessionToken') || '');
  const code = String(formData.get('code') || '');

  console.log('[api.auth.verify-mobile] payload', { verificationSessionToken, code });

  if (!verificationSessionToken || !code) {
    return data({ error: 'Mangler verifiseringskode. Prøv igjen.' }, { status: 400 });
  }

  try {
    const response = await AuthController.verifyMobile({
      body: {
        verificationSessionToken,
        code,
      },
    });

    const nextStep = response.data?.data?.nextStep ?? 'SIGN_IN';
    const authTokens = response.data?.data?.authTokens;

    if (authTokens) {
      const headers = await authService.setAuthCookies(
        authTokens.accessToken,
        authTokens.refreshToken,
        authTokens.accessTokenExpiresAt,
        authTokens.refreshTokenExpiresAt,
      );
      return data({ success: true, nextStep, signedIn: true }, { headers });
    }

    return data({ success: true, nextStep, signedIn: false });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke bekrefte mobilnummer. Prøv igjen.');
    return data({ error: message }, { status: status ?? 400 });
  }
}
