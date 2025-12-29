// auth.accept-invite.route.tsx (refactored)
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.accept-invite.route';

import { OpenAPI } from '~/api/clients/base/OpenAPI';
import { ENV } from '~/api/config/env';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { baseApi } from '~/lib/utils';
import { toAuthTokens } from '../_utils/token.utils';
import type { ApiClientError } from '~/api/clients/http';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { redirectWithInfo, redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('token');

  if (!inviteToken) {
    return redirect('/');
  }

  return { inviteToken };
}

export async function action({ request }: Route.ActionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const formData = await request.formData();
  const inviteToken = String(formData.get('inviteToken'));
  const givenName = String(formData.get('givenName'));
  const familyName = String(formData.get('familyName'));
  const password = String(formData.get('password'));
  const confirmPassword = String(formData.get('confirmPassword'));

  try {
    const response = await baseApi().AuthControllerService.AuthControllerService.acceptInvite({
      inviteToken,
      requestBody: {
        givenName,
        familyName,
        password,
        password2: confirmPassword,
      },
    });

    if (!response.success || !response.data) {
      return data(
        {
          error: 'Kunne ikke opprette kontoen. Prøv igjen.',
          values: { givenName, familyName },
        },
        { status: 400 },
      );
    }

    const tokens = toAuthTokens(response.data);

    const accessCookie = await accessTokenCookie.serialize(tokens.accessToken, {
      expires: new Date(tokens.accessTokenExpiresAt * 1000),
    });
    const refreshCookie = await refreshTokenCookie.serialize(tokens.refreshToken, {
      expires: new Date(tokens.refreshTokenExpiresAt * 1000),
    });

    return redirectWithSuccess(request, '/', 'Kontoen din er opprettet', [
      ['Set-Cookie', accessCookie],
      ['Set-Cookie', refreshCookie],
    ]);
  } catch (error: any) {
    console.error('[accept-invite] Error:', error);

    if (error as ApiClientError) {
      return data(
        {
          error: error.body?.message || 'Noe gikk galt. Prøv igjen.',
          values: { givenName, familyName },
        },
        { status: 400 },
      );
    }

    throw error;
  }
}

export default function AuthAcceptInvite({ loaderData, actionData }: Route.ComponentProps) {
  const { inviteToken } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <AuthFormContainer
      title="Fullfør din konto"
      description="Opprett profilen din og sett passord for å aktivere tilgangen din."
      error={actionData?.error}
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
            defaultValue={actionData?.values?.givenName}
            required
            disabled={isSubmitting}
          />

          <AuthFormField
            id="familyName"
            name="familyName"
            label="Etternavn"
            type="text"
            autoComplete="family-name"
            defaultValue={actionData?.values?.familyName}
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
