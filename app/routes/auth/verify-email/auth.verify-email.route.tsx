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
    await AuthController.verifyEmail({
      query: { token },
    });

    return data({ error: null });
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
          ? 'E-postadressen din er nå verifisert. Du kan logge inn med passordet ditt.'
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
            ? 'Når e-posten er bekreftet, kan du logge inn og fortsette registreringen.'
            : 'Sjekk at du brukte den nyeste lenken fra e-posten, eller be om en ny verifisering.'}
        </p>
        <AuthFormButton asChild variant="secondary">
          <Link to={ROUTES_MAP['auth.sign-in'].href}>Gå til innlogging</Link>
        </AuthFormButton>
      </div>
    </AuthFormContainer>
  );
}
