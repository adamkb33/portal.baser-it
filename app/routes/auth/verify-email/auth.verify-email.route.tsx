// auth.verify-email.route.tsx
import { Link, data, redirect } from 'react-router';
import type { Route } from './+types/auth.verify-email.route';

import { AuthController } from '~/api/generated/identity';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormButton } from '../_components/auth.form-button';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect(ROUTES_MAP['auth.sign-in'].href);
  }

  try {
    const response = await AuthController.verifyEmail({
      query: { token },
    });

    const payload = response.data?.data;
    if (payload?.nextStep === 'VERIFY_MOBILE' && payload.verificationSessionToken) {
      const params = new URLSearchParams({
        verificationSessionToken: payload.verificationSessionToken,
      });
      return redirect(`${ROUTES_MAP['auth.verify-mobile'].href}?${params.toString()}`);
    }

    return data({
      error: null,
      nextStep: payload?.nextStep ?? 'SIGN_IN',
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Ugyldig eller utløpt verifiseringslenke.');
    return data({ error: message }, { status: status ?? 400 });
  }
}

export default function AuthVerifyEmail({ loaderData }: Route.ComponentProps) {
  const isSuccess = !loaderData?.error;

  return (
    <AuthFormContainer
      title={isSuccess ? 'E-post bekreftet' : 'Kunne ikke bekrefte e-post'}
      description={
        isSuccess
          ? 'E-postadressen din er nå verifisert.'
          : 'Vi klarte ikke å bekrefte e-posten din. Be om en ny lenke eller prøv igjen senere.'
      }
      error={loaderData?.error}
      secondaryAction={
        <Link to="/" className="block text-center text-sm font-medium text-muted-foreground hover:underline">
          Tilbake til forsiden →
        </Link>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-form-text-muted">
          {isSuccess
            ? 'Du kan nå gå videre til innlogging.'
            : 'Sjekk at du brukte den nyeste lenken fra e-posten, eller be om en ny verifisering.'}
        </p>
        <AuthFormButton asChild variant="secondary">
          <Link to={ROUTES_MAP['auth.sign-in'].href}>Gå til innlogging</Link>
        </AuthFormButton>
      </div>
    </AuthFormContainer>
  );
}
