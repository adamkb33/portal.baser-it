// auth.sign-up.route.tsx
import { Form, Link, data, redirect, useNavigation } from 'react-router';
import type { Route } from './+types/auth.sign-up.route';

import { AuthController } from '~/api/generated/identity';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';

type SignUpActionValues = {
  givenName?: string;
  familyName?: string;
  email?: string;
  mobileNumber?: string;
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const givenName = String(formData.get('givenName') || '');
  const familyName = String(formData.get('familyName') || '');
  const email = String(formData.get('email') || '');
  const mobileNumberValue = String(formData.get('mobileNumber') || '').trim();
  const password = String(formData.get('password') || '');
  const password2 = String(formData.get('password2') || '');

  try {
    const response = await AuthController.signUp({
      body: {
        givenName,
        familyName,
        email,
        password,
        password2,
        ...(mobileNumberValue ? { mobileNumber: mobileNumberValue } : {}),
      },
    });

    const signUpPayload = response.data?.data;
    if (!signUpPayload) {
      const message = response.data?.message || 'Kunne ikke opprette konto. Prøv igjen.';
      return data(
        {
          error: message,
          values: { givenName, familyName, email, mobileNumber: mobileNumberValue },
        },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({
      verificationSessionToken: signUpPayload.verificationSessionToken,
      emailSent: signUpPayload.emailSent ? 'true' : 'false',
      mobileSent: signUpPayload.mobileSent ? 'true' : 'false',
    });

    return redirect(`${ROUTES_MAP['auth.verify-mobile'].href}?${params.toString()}`);
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke opprette konto. Prøv igjen.');
    return data(
      {
        error: message,
        values: { givenName, familyName, email, mobileNumber: mobileNumberValue },
      },
      { status: status ?? 400 },
    );
  }
}

export default function AuthSignUp({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const errorMessage = actionData?.error;
  const actionValues = actionData?.values as SignUpActionValues | undefined;

  return (
    <AuthFormContainer
      title="Opprett konto"
      description="Registrer deg for å få tilgang til selskapet ditt og kundene dine."
      error={errorMessage}
      secondaryAction={
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground">Har du allerede en konto?</p>
          <Link
            to={ROUTES_MAP['auth.sign-in'].href}
            className="inline-block text-sm font-medium text-foreground hover:underline"
          >
            Logg inn →
          </Link>
        </div>
      }
    >
      <Form method="post" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthFormField
            id="givenName"
            name="givenName"
            label="Fornavn"
            autoComplete="given-name"
            placeholder="Ola"
            defaultValue={actionValues?.givenName}
            required
            disabled={isSubmitting}
          />

          <AuthFormField
            id="familyName"
            name="familyName"
            label="Etternavn"
            autoComplete="family-name"
            placeholder="Nordmann"
            defaultValue={actionValues?.familyName}
            required
            disabled={isSubmitting}
          />
        </div>

        <AuthFormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          placeholder="din@e-post.no"
          defaultValue={actionValues?.email}
          required
          disabled={isSubmitting}
        />

        <AuthFormField
          id="mobileNumber"
          name="mobileNumber"
          label="Mobilnummer (valgfritt)"
          autoComplete="tel"
          placeholder="47 123 45 678"
          defaultValue={actionValues?.mobileNumber}
          disabled={isSubmitting}
        />

        <AuthFormField
          id="password"
          name="password"
          label="Passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <AuthFormField
          id="password2"
          name="password2"
          label="Bekreft passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <p className="text-xs text-form-text-muted">
          Vi sender en bekreftelseslenke til e-posten din. Oppgir du mobilnummer, får du også en engangskode på SMS.
        </p>

        <AuthFormButton isLoading={isSubmitting} loadingText="Oppretter konto…">
          Opprett konto
        </AuthFormButton>
      </Form>
    </AuthFormContainer>
  );
}
