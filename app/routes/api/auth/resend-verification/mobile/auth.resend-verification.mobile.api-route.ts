import { data, type ActionFunctionArgs } from 'react-router';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { ContactAuthService } from '~/routes/_features/booking/session/contact/_services/contact-auth.service.server';
import { VerificationTokenService } from '~/routes/_features/booking/session/contact/_services/verification-token.service.server';
import {
  extractAuthErrorCode,
  resolveMappedAuthError,
} from '~/routes/_features/booking/session/contact/_utils/auth-step-error';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const verificationToken = String(formData.get('verificationSessionToken') || '');
  const email = String(formData.get('email') || '');
  const redirectUrl = String(formData.get('redirectUrl') || '');

  if (!verificationToken && !email) {
    return data({ error: 'Mangler verifiseringsinformasjon. Prøv igjen.' }, { status: 400 });
  }

  try {
    const response = await ContactAuthService.resendVerification({
      redirectUrl,
      verificationSessionToken: verificationToken,
      email,
      sendEmail: false,
      sendMobile: true,
    });

    const nextToken = response.nextToken ?? verificationToken;
    const successMessage = response.successMessage;

    const headers = new Headers();

    // Set verification token cookie
    if (nextToken) {
      const cookie = await VerificationTokenService.buildVerificationCookieHeader(
        nextToken,
        response.nextTokenExpiresAt ?? undefined,
      );
      headers.append('Set-Cookie', cookie);
    }

    const flashCookie = await setFlashMessage(request, {
      type: 'success',
      text: successMessage,
    });
    headers.append('Set-Cookie', flashCookie);

    const payload = {
      success: true,
      message: successMessage,
      verificationSessionToken: nextToken,
      data: response.data ?? null,
    };

    return data(payload, { headers });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke sende ny kode. Prøv igjen.');
    const errorCode = extractAuthErrorCode(error);
    return data({ error: resolveMappedAuthError(error, message), errorCode }, { status: status ?? 400 });
  }
}
