import * as React from 'react';
import { Link, redirect, useSubmit, useNavigation, data } from 'react-router';
import type { Route } from './+types/auth.reset-password.route';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { resetPasswordFormSchema, type ResetPasswordFormSchema } from './_schemas/reset-password.form.schema';
import { decodeResetPasswordToken } from './_utils/auth.reset-password.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthControllerService } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import { accessTokenCookie, refreshTokenCookie } from '~/routes/auth/_features/auth.cookies.server';
import { toAuthTokens } from '../_utils/token.utils';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const resetPasswordToken = url.searchParams.get('token');

  if (!resetPasswordToken) {
    throw redirect('/');
  }

  const decodedToken = decodeResetPasswordToken(resetPasswordToken);
  if (!decodedToken || !decodedToken.email) {
    throw redirect('/');
  }

  return { resetPasswordToken, email: decodedToken.email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  try {
    const response = await AuthControllerService.resetPassword({
      requestBody: {
        resetPasswordToken: String(formData.get('resetPasswordToken')),
        password: String(formData.get('password')),
        password2: String(formData.get('confirmPassword')),
      },
    });

    if (!response.success || !response.data) {
      return data(
        {
          error: 'Token er ikke gyldig',
          tokenInvalid: true,
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
    // Handle API client errors
    if (error.body?.message) {
      const errorMessage = error.body.message;
      const isTokenError =
        errorMessage.toLowerCase().includes('token') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('ugyldig');

      return data(
        {
          error: errorMessage,
          tokenInvalid: isTokenError,
        },
        { status: 400 },
      );
    }

    // Unexpected errors - let ErrorBoundary handle
    console.error('[reset-password] Unexpected error:', error);
    throw error;
  }
}

export default function AuthResetPasswordRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { resetPasswordToken, email } = loaderData;
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const form = useForm<ResetPasswordFormSchema>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      resetPasswordToken,
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = React.useCallback(
    (values: ResetPasswordFormSchema) => {
      const formData = new FormData();
      formData.set('resetPasswordToken', resetPasswordToken);
      formData.set('password', values.password);
      formData.set('confirmPassword', values.confirmPassword);

      submit(formData, { method: 'post' });
    },
    [submit, resetPasswordToken],
  );

  // Show token invalid state
  if (actionData?.tokenInvalid) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 px-5 py-6 text-center">
          <h2 className="text-xl font-semibold">Ugyldig eller utløpt link</h2>
          <p className="text-sm text-muted-foreground">
            {actionData.error ||
              'Denne tilbakestillingslinken er ikke lenger gyldig. Vennligst be om en ny tilbakestilling av passord.'}
          </p>
          <Link to={ROUTES_MAP['auth.forgot-password'].href} className="text-primary hover:underline inline-block mt-2">
            Be om ny tilbakestillingslink
          </Link>
        </div>

        <div className="text-center text-sm">
          <Link to="/" className="text-primary hover:underline">
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Tilbakestill passord</h1>
        <p className="text-muted-foreground text-sm">Opprett et nytt passord for din konto.</p>
      </header>

      {actionData?.error && !actionData.tokenInvalid ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          <input type="hidden" name="resetPasswordToken" value={resetPasswordToken} />

          <FormField
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>E-post</FormLabel>
                <FormControl>
                  <Input value={email} autoComplete="email" disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passord</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bekreft passord</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Tilbakestiller…' : 'Tilbakestill passord'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Tilbake til forsiden
        </Link>
      </div>
    </div>
  );
}
