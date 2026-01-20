// auth.accept-invite.route.tsx (refactored)
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.accept-invite.route';

import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { toAuthTokens } from '../_utils/token.utils';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';
import { AuthController } from '~/api/generated/identity';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('token');

  if (!inviteToken) {
    return redirect('/');
  }

  return { inviteToken };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const inviteToken = String(formData.get('inviteToken'));
  const givenName = String(formData.get('givenName'));
  const familyName = String(formData.get('familyName'));
  const password = String(formData.get('password'));
  const confirmPassword = String(formData.get('confirmPassword'));

  try {
    const response = await AuthController.acceptInvite({
      path: {
        inviteToken,
      },
      body: {
        givenName,
        familyName,
        password,
        password2: confirmPassword,
      },
    });
    const tokens = response.data?.data;

    if (!tokens) {
      const message = response.data?.message || 'Noe gikk galt. Prøv igjen.';
      return data(
        {
          error: message,
          values: { givenName, familyName },
        },
        { status: 400 },
      );
    }

    const authTokens = toAuthTokens(tokens);

    const accessCookie = await accessTokenCookie.serialize(authTokens.accessToken, {
      expires: new Date(authTokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(authTokens.refreshToken, {
      expires: new Date(authTokens.refreshTokenExpiresAt * 1000),
    });

    return redirectWithSuccess(request, '/', 'Kontoen din er opprettet', [
      ['Set-Cookie', accessCookie],
      ['Set-Cookie', refreshCookie],
    ]);
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Noe gikk galt. Prøv igjen.');
    return data(
      {
        error: message,
        values: { givenName, familyName },
      },
      { status: status ?? 400 },
    );
  }
}

export default function AuthAcceptInvite({ loaderData, actionData }: Route.ComponentProps) {
  const { inviteToken } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const errorMessage = actionData?.error;
  const actionValues = actionData?.values;

  return (
    <AuthFormContainer
      title="Fullfør din konto"
      description="Opprett profilen din og sett passord for å aktivere tilgangen din."
      error={errorMessage}
      secondaryAction={
        <Link to="/" className="mt-2 block text-center text-sm font-medium text-foreground hover:underline">
          Tilbake til forsiden →
        </Link>
      }
    >
      <Form method="post" className="space-y-6">
        <input type="hidden" name="inviteToken" value={inviteToken} />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthFormField
            id="givenName"
            name="givenName"
            label="Fornavn"
            type="text"
            autoComplete="given-name"
            defaultValue={actionValues?.givenName}
            required
            disabled={isSubmitting}
          />

          <AuthFormField
            id="familyName"
            name="familyName"
            label="Etternavn"
            type="text"
            autoComplete="family-name"
            defaultValue={actionValues?.familyName}
            required
            disabled={isSubmitting}
          />
        </div>

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
          id="confirmPassword"
          name="confirmPassword"
          label="Bekreft passord"
          type="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
        />

        <AuthFormButton isLoading={isSubmitting} loadingText="Oppretter konto…">
          Opprett konto
        </AuthFormButton>
      </Form>
    </AuthFormContainer>
  );
}
