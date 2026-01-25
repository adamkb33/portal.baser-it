// auth.verify-mobile.route.tsx
import { Form, Link, data, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/auth.verify-mobile.route';

import { AuthController } from '~/api/generated/identity';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';

type VerifyMobileLoaderData = {
  verificationSessionToken: string;
  status?: {
    emailVerified: boolean;
    mobileRequired: boolean;
    mobileVerified: boolean;
    emailSent: boolean;
    mobileSent: boolean;
    nextStep: 'VERIFY_EMAIL' | 'VERIFY_MOBILE' | 'SIGN_IN';
  };
  error?: string | null;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const verificationSessionToken = url.searchParams.get('verificationSessionToken');
  if (!verificationSessionToken) {
    return redirect(ROUTES_MAP['auth.sign-in'].href);
  }

  try {
    const response = await AuthController.verificationStatus({
      query: { verificationSessionToken },
    });
    const status = response.data?.data;
    if (!status) {
      return data(
        {
          verificationSessionToken,
          error: 'Kunne ikke hente verifiseringsstatus. Prøv igjen.',
        },
        { status: 400 },
      );
    }

    return data({
      verificationSessionToken,
      status,
      error: null,
    } satisfies VerifyMobileLoaderData);
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente verifiseringsstatus. Prøv igjen.');
    return data(
      {
        verificationSessionToken,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
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
    const response = await AuthController.verifyMobile({
      body: {
        verificationSessionToken,
        code,
      },
    });

    return data({ success: true, nextStep: response.data?.data?.nextStep ?? 'SIGN_IN' });
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
  const errorMessage = actionData?.error ?? dataValues.error;
  const isMobileVerified = actionData?.success === true;
  const status = dataValues.status;
  const canVerifyMobile =
    status?.emailVerified && status?.mobileRequired && !status.mobileVerified && !isMobileVerified;
  const description = !status?.emailVerified
    ? 'Bekreft e-posten din før du verifiserer mobilnummer.'
    : status?.mobileRequired
      ? 'E-posten din er bekreftet. Skriv inn engangskoden fra SMS for å fullføre registreringen.'
      : 'Du trenger ikke verifisere mobilnummer. Du kan gå videre til innlogging.';

  return (
    <AuthFormContainer
      title="Bekreft mobilnummer"
      description={description}
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
        {!status?.emailVerified ? (
          <div className="rounded-md border border-form-border bg-form-accent/30 px-4 py-3 text-sm text-form-text">
            Du må bekrefte e-posten din før mobilnummeret kan verifiseres.
          </div>
        ) : null}

        {status && !status.mobileRequired ? (
          <div className="rounded-md border border-form-border bg-form-accent/30 px-4 py-3 text-sm text-form-text">
            Du la ikke til et mobilnummer. Du kan gå videre til innlogging.
          </div>
        ) : null}

        {isMobileVerified ? (
          <div className="rounded-md border border-form-border bg-form-accent/30 px-4 py-3 text-sm text-form-text">
            Mobilnummeret ditt er bekreftet. Du kan gå videre til innlogging.
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

        {(status?.mobileVerified || isMobileVerified || !status?.mobileRequired) && (
          <AuthFormButton asChild variant="secondary">
            <Link to={ROUTES_MAP['auth.sign-in'].href}>Gå til innlogging</Link>
          </AuthFormButton>
        )}
      </div>
    </AuthFormContainer>
  );
}
