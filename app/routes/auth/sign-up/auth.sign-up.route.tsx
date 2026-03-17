// auth.sign-up.route.tsx
import { Link, Form, redirect, data, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/auth.sign-up.route';
import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthController } from '~/api/generated/base';
import { resolveErrorPayload } from '~/lib/api-error';
import { resolveAuthPostRedirect } from '../_utils/auth-flow.server';
import { authService } from '~/lib/auth-service';
import { Button, FormField, FormPageTemplate } from '~/ui';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const givenName = String(formData.get('givenName') || '');
  const familyName = String(formData.get('familyName') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const password2 = String(formData.get('password2') || '');
  const mobileNumber = String(formData.get('mobileNumber') || '');
  const redirectUrl = String(formData.get('redirectUrl') || '');

  try {
    const response = await AuthController.signUp({
      query: {
        redirectUrl: redirectUrl || undefined,
      },
      body: {
        givenName,
        familyName,
        email,
        password,
        password2,
        mobileNumber,
      },
    });

    const payload = response.data?.data ?? null;
    const { nextStepHref, verificationCookieHeader } = await resolveAuthPostRedirect(payload);
    const headers = new Headers();

    if (payload?.authTokens) {
      const authCookieHeaders = await authService.setAuthCookies(
        payload.authTokens.accessToken,
        payload.authTokens.refreshToken,
        payload.authTokens.accessTokenExpiresAt,
        payload.authTokens.refreshTokenExpiresAt,
      );
      for (const [key, value] of new Headers(authCookieHeaders).entries()) {
        headers.append(key, value);
      }
    }

    if (verificationCookieHeader) {
      headers.append('Set-Cookie', verificationCookieHeader);
    }

    return redirect(nextStepHref ?? ROUTES_MAP['auth.sign-in'].href, {
      headers: headers.entries().next().done ? undefined : headers,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke opprette konto. Prøv igjen.');
    return data({ error: message }, { status: status ?? 400 });
  }
}

export default function AuthSignUp() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const errorMessage =
    actionData && typeof actionData === 'object' && 'error' in actionData ? String(actionData.error) : undefined;

  return (
    <FormPageTemplate
      title="Opprett konto"
      description="Registrer deg for å få tilgang til selskapet ditt og kundene dine."
      error={errorMessage}
      variant="airy"
      actions={
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
      footerLink={null}
    >
      <Form method="post" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="givenName"
            name="givenName"
            label="Fornavn"
            autoComplete="given-name"
            placeholder="Ola"
            required
            disabled={isSubmitting}
          />

          <FormField
            id="familyName"
            name="familyName"
            label="Etternavn"
            autoComplete="family-name"
            placeholder="Nordmann"
            required
            disabled={isSubmitting}
          />
        </div>

        <FormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          placeholder="e-post"
          required
          disabled={isSubmitting}
        />

        <FormField
          id="mobileNumber"
          name="mobileNumber"
          label="Mobilnummer (valgfritt)"
          autoComplete="tel"
          placeholder="mobilnummer"
          disabled={isSubmitting}
        />

        <FormField
          id="password"
          name="password"
          label="Passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <FormField
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

        <Button type="submit" fullWidth loading={isSubmitting}>
          Opprett konto
        </Button>
      </Form>
    </FormPageTemplate>
  );
}
