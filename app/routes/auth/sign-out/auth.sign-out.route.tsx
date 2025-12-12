import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.sign-out.route';

import { ApiClientError, OpenAPI } from '~/api/clients/http';
import { AuthControllerService } from '~/api/clients/base';
import { ENV } from '~/api/config/env';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { toAuthPayload } from '~/routes/auth/_utils/token-payload';
import { useEffect, useRef } from 'react';

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const accessToken = await accessTokenCookie.parse(cookieHeader);

  const expiredAccessCookie = await accessTokenCookie.serialize('', { maxAge: 0 });
  const expiredRefreshCookie = await refreshTokenCookie.serialize('', { maxAge: 0 });

  const headers = new Headers();
  headers.append('Set-Cookie', expiredAccessCookie);
  headers.append('Set-Cookie', expiredRefreshCookie);

  if (!accessToken) {
    return redirect('/auth/sign-in', { headers });
  }

  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  try {
    const authPayload = toAuthPayload(accessToken);
    if (!authPayload) {
      return redirect('/auth/sign-in', { headers });
    }

    const response = await AuthControllerService.signOut({
      requestBody: { userId: authPayload.id },
    });

    if (response.success) {
      return redirect('/', { headers });
    }

    return data({ error: 'Utlogging feilet. Prøv igjen.' }, { status: 400, headers });
  } catch (error: any) {
    console.error('[sign-out] Error:', error);

    if (error as ApiClientError) {
      return data({ error: error.body?.message || 'Noe gikk galt under utlogging.' }, { status: 400, headers });
    }

    // Clear cookies even on error
    return redirect('/auth/sign-in', { headers });
  }
}

export default function AuthSignOut({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const isProcessing = navigation.state === 'submitting';

  useEffect(() => {
    if (!actionData && formRef.current) {
      formRef.current.requestSubmit();
    }
  }, [actionData]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-12 text-center">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Logger ut</h1>
        {isProcessing && !actionData?.error ? (
          <p className="text-sm text-muted-foreground">Vennligst vent mens vi avslutter økten din.</p>
        ) : actionData?.error ? (
          <p className="text-sm text-muted-foreground">{actionData.error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Fullfører...</p>
        )}
      </header>

      {actionData?.error ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Din lokale økt er slettet. Du kan prøve igjen eller fortsette til innloggingssiden.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Form method="post">
              <button
                type="submit"
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100"
                disabled={isProcessing}
              >
                Prøv igjen
              </button>
            </Form>
            <Link to="/auth/sign-in" className="text-sm text-primary hover:underline">
              Gå til innlogging
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Du blir omdirigert om et øyeblikk.</p>
          <Form method="post" ref={formRef} className="hidden">
            <button type="submit">Sign out</button>
          </Form>
        </>
      )}
    </div>
  );
}
