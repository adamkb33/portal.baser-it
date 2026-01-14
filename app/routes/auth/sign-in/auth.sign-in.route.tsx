// auth.sign-in.route.tsx
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.sign-in.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import type { ApiClientError } from '~/api/clients/http';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { AuthController } from '~/api/generated/identity';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  try {
    const response = await AuthController.signIn({
      body: { email, password },
    });

    const tokens = response.data?.data;

    if (!tokens) {
      return data(
        {
          error: 'Ugyldig e-post eller passord',
          values: { email },
        },
        { status: 400 },
      );
    }

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    return redirect('/', {
      headers: [
        ['Set-Cookie', accessCookie],
        ['Set-Cookie', refreshCookie],
      ],
    });
  } catch (error: any) {
    console.error('[sign-in] Error:', error);

    if (error as ApiClientError) {
      return data(
        {
          error: error.body?.message || 'Noe gikk galt. Prøv igjen.',
          values: { email },
        },
        { status: 400 },
      );
    }

    throw error;
  }
}

export default function AuthSignIn({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <AuthFormContainer
      title="Logg inn"
      description="Logg inn for å administrere ditt selskap og kundeforhold."
      error={actionData?.error}
      secondaryAction={
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground">Glemt passordet?</p>
          <Link
            to={ROUTES_MAP['auth.forgot-password'].href}
            className="inline-block text-sm font-medium text-foreground hover:underline"
          >
            Tilbakestill passord →
          </Link>
        </div>
      }
    >
      <Form method="post" className="space-y-4 md:space-y-6" aria-busy={isSubmitting}>
        <AuthFormField
          id="email"
          name="email"
          label="E-post"
          type="email"
          autoComplete="email"
          placeholder="din@e-post.no"
          defaultValue={actionData?.values?.email}
          required
          disabled={isSubmitting}
        />

        <AuthFormField
          id="password"
          name="password"
          label="Passord"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />

        <div className="pt-2">
          <AuthFormButton isLoading={isSubmitting} loadingText="Logger inn…">
            Logg inn
          </AuthFormButton>
        </div>
      </Form>
    </AuthFormContainer>
  );
}
