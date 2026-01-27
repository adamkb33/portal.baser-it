import { data } from 'react-router';
import type { Route } from './+types/auth.resend-verification.api-route';
import { AuthController } from '~/api/generated/identity';
import { resolveErrorPayload } from '~/lib/api-error';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const verificationSessionToken = String(formData.get('verificationSessionToken') || '');
  const email = String(formData.get('email') || '');

  console.log('[api.auth.resend-verification] payload', { verificationSessionToken, email });

  if (!verificationSessionToken && !email) {
    return data({ error: 'Mangler verifiseringsinformasjon. Prøv igjen.' }, { status: 400 });
  }

  try {
    const response = await AuthController.resendVerification({
      body: {
        verificationSessionToken: verificationSessionToken || undefined,
        email: email || undefined,
      },
    });

    return data({
      success: true,
      message: response.data?.message?.value ?? 'Ny kode sendt.',
      verificationSessionToken: response.data?.data?.verificationSessionToken ?? verificationSessionToken,
      data: response.data?.data ?? null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke sende ny kode. Prøv igjen.');
    return data({ error: message }, { status: status ?? 400 });
  }
}
