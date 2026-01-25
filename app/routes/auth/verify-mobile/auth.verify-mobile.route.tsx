// auth.verify-mobile.route.tsx
import { Form, Link, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.verify-mobile.route';

import { AuthController } from '~/api/generated/identity';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';

type VerifyMobileLoaderData = {
  verificationSessionToken: string | null;
  emailSent: boolean;
  mobileSent: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const verificationSessionToken = url.searchParams.get('verificationSessionToken');
  const emailSent = url.searchParams.get('emailSent') === 'true';
  const mobileSent = url.searchParams.get('mobileSent') === 'true';

  return data({
    verificationSessionToken,
    emailSent,
    mobileSent,
  } satisfies VerifyMobileLoaderData);
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const verificationSessionToken = String(formData.get('verificationSessionToken') || '');
  const code = String(formData.get('code') || '');

  if (!verificationSessionToken || !code) {
    return data(
      {
        error: 'Mangler verifiseringskode. Prøv igjen.',
      },
      { status: 400 },
    );
  }

  try {
    await AuthController.verifyMobile({
      body: {
        verificationSessionToken,
        code,
      },
    });

    return data({ success: true });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke bekrefte mobilnummer. Prøv igjen.');
    return data(
      {
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function AuthVerifyMobile({ loaderData, actionData }: Route.ComponentProps) {
  const dataValues = loaderData as VerifyMobileLoaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const errorMessage = actionData?.error;
  const isMobileVerified = actionData?.success === true;
  const canVerifyMobile = dataValues.mobileSent && dataValues.verificationSessionToken && !isMobileVerified;

  return (
    <AuthFormContainer
      title="Bekreft kontoen din"
      description="Bekreft e-postadressen din før du logger inn. Har du lagt til mobilnummer, kan du også bekrefte det her."
      error={errorMessage}
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
      <div className="space-y-4">
        <div className="space-y-2 text-sm text-form-text-muted">
          <p>
            {dataValues.emailSent
              ? 'Vi har sendt en bekreftelseslenke til e-posten din.'
              : 'Vi klarte ikke å sende e-post. Prøv å registrere deg på nytt eller kontakt support.'}
          </p>
          <p>
            {dataValues.mobileSent
              ? 'Skriv inn engangskoden fra SMS for å bekrefte mobilnummeret ditt.'
              : 'Du oppga ikke mobilnummer, så ingen SMS-verifisering er nødvendig.'}
          </p>
        </div>

        {isMobileVerified ? (
          <div className="rounded-md border border-form-border bg-form-accent/30 px-4 py-3 text-sm text-form-text">
            Mobilnummeret ditt er bekreftet. Du kan logge inn når e-posten også er verifisert.
          </div>
        ) : null}

        {canVerifyMobile ? (
          <Form method="post" className="space-y-4">
            <input type="hidden" name="verificationSessionToken" value={dataValues.verificationSessionToken ?? ''} />

            <AuthFormField
              id="code"
              name="code"
              label="Engangskode"
              autoComplete="one-time-code"
              placeholder="123456"
              required
              disabled={isSubmitting}
            />

            <AuthFormButton isLoading={isSubmitting} loadingText="Bekrefter…">
              Bekreft mobilnummer
            </AuthFormButton>
          </Form>
        ) : null}
      </div>
    </AuthFormContainer>
  );
}
