import { data } from 'react-router';
import type { Route } from './+types/auth.verification-status.api-route';
import { AuthController } from '~/api/generated/identity';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const verificationSessionToken = String(url.searchParams.get('verificationSessionToken') || '');

  if (!verificationSessionToken) {
    return data({ error: 'Mangler verifiseringsinformasjon. Prøv igjen.' }, { status: 400 });
  }

  try {
    const response = await AuthController.verificationStatus({
      query: { verificationSessionToken },
    });

    return data({
      success: true,
      nextStep: response.data?.data?.nextStep ?? null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente status. Prøv igjen.');
    return data({ error: message }, { status: status ?? 400 });
  }
}
