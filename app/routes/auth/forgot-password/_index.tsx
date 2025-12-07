import * as React from 'react';
import { useFetcher, Link, type ActionFunctionArgs, redirect } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import { AuthControllerService } from '~/api/clients/base';
import { ForgotPasswordForm } from '~/routes/auth/forgot-password/_forms/forgot-password.form';

import type { ForgotPasswordSchema } from '~/routes/auth/forgot-password/_schemas/forgot-password-form.schema';

import { ROUTES_MAP } from '~/lib/route-tree';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  try {
    await AuthControllerService.forgotPassword({
      requestBody: {
        email: email,
      },
    });

    return redirect('/');
  } catch (error: any) {
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AuthForgotPasswordRoute() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;

  const handleSubmit = React.useCallback(
    (values: ForgotPasswordSchema) => {
      const payload = new FormData();
      payload.set('email', values.email);

      fetcher.submit(payload, {
        method: 'post',
        action: '/auth/forgot-password',
      });
    },
    [fetcher],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Glemt passord</h1>
        <p className="text-muted-foreground text-sm">
          Oppgi din e-post for å tilbakestille ditt passord. Følg lenken du får tilsendt på din e-post adresse.
        </p>
      </header>

      {actionData?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      <ForgotPasswordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={actionData?.values} />

      <p className="text-center text-sm text-muted-foreground">
        Var det ikke denne siden du letet etter?{' '}
        <Link to={ROUTES_MAP['auth.sign-in'].href} className="text-primary hover:underline">
          Tilbake til innlogging
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
