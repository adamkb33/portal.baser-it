// auth.check-email.route.tsx
import { Link, data } from 'react-router';
import type { Route } from './+types/auth.check-email.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthFormContainer } from '../_components/auth.form-container';

type CheckEmailLoaderData = {
  emailSent: boolean;
  mobileSent: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const emailSent = url.searchParams.get('emailSent') === 'true';
  const mobileSent = url.searchParams.get('mobileSent') === 'true';

  return data({ emailSent, mobileSent } satisfies CheckEmailLoaderData);
}

export default function AuthCheckEmail({ loaderData }: Route.ComponentProps) {
  const { emailSent, mobileSent } = loaderData;
  const hasError = !emailSent;

  return (
    <AuthFormContainer
      title="Sjekk e-posten din"
      description={
        hasError
          ? 'Vi klarte ikke å sende verifiseringslenken. Prøv å registrere deg på nytt eller kontakt support.'
          : 'Vi har sendt deg en lenke for å bekrefte e-posten din.'
      }
      error={hasError ? 'E-posten ble ikke sendt.' : undefined}
      secondaryAction={
        <div className="space-y-2 text-center">
          <Link
            to={ROUTES_MAP['auth.sign-in'].href}
            className="inline-block text-sm font-medium text-foreground hover:underline"
          >
            Gå til innlogging →
          </Link>
          <Link to="/" className="block text-sm font-medium text-muted-foreground hover:underline">
            Tilbake til forsiden →
          </Link>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-form-text-muted">
        <p>Følg instruksene i e-posten for å bekrefte kontoen din.</p>
        {mobileSent ? (
          <p>Når e-posten er bekreftet, vil du bli bedt om å verifisere mobilnummeret ditt med en SMS-kode.</p>
        ) : (
          <p>Du trenger ikke verifisere mobilnummer siden du ikke la til et nummer.</p>
        )}
      </div>
    </AuthFormContainer>
  );
}
