import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/_index';

import { ROUTES_MAP } from '~/lib/route-tree';
import { OpenAPI } from '~/api/clients/base/OpenAPI';
import { ENV } from '~/api/config/env';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { baseApi } from '~/lib/utils';
import { toAuthTokens } from '../_utils/token.utils';
import type { ApiClientError } from '~/api/clients/http';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export async function action({ request }: Route.ActionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  try {
    const response = await baseApi().AuthControllerService.AuthControllerService.signIn({
      requestBody: { email, password },
    });

    if (!response.success || !response.data) {
      return data(
        {
          error: 'Ugyldig e-post eller passord',
          values: { email },
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Logg inn</h1>
        <p className="text-muted-foreground text-sm">
          Logg inn for å ta i bruk våre tjenester, administrer ditt selskap og ditt kundeforhold.
        </p>
      </header>

      {actionData?.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="din@e-post.no"
            defaultValue={actionData?.values?.email}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Passord</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logger inn…' : 'Logg inn'}
        </Button>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Har du glemt ditt passord?{' '}
        <Link to={ROUTES_MAP['auth.forgot-password'].href} className="text-primary hover:underline">
          Tilbakestill passordet ditt her.
        </Link>
      </p>

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Tilbake til hovedsiden
        </Link>
      </div>
    </div>
  );
}
