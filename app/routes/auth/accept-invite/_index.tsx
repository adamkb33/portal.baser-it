import * as React from 'react';
import {
  Link,
  redirect,
  useSubmit,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { acceptInviteSchema, type AcceptInviteSchema } from './_schemas/accept-invite.form.schema';
import { OpenAPI, ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { baseApi } from '~/lib/utils';
import { accessTokenCookie, refreshTokenCookie } from '../_features/auth.cookies.server';
import { toAuthTokens } from '../_utils/token.utils';
import type { Route } from './+types/_index';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('token');

  if (!inviteToken) {
    return redirect('/');
  }

  return { inviteToken };
}

export async function action({ request }: ActionFunctionArgs) {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  const formData = await request.formData();
  const payload = Object.fromEntries(formData) as unknown as AcceptInviteSchema;

  try {
    const response = await baseApi().AuthControllerService.AuthControllerService.acceptInvite({
      inviteToken: payload.inviteToken,
      requestBody: {
        givenName: payload.givenName,
        familyName: payload.familyName,
        password: payload.password,
        password2: payload.confirmPassword,
      },
    });

    if (!response.success || !response.data) {
      throw new Error();
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
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AuthAcceptInviteRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { inviteToken } = loaderData;
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const form = useForm<AcceptInviteSchema>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      inviteToken,
      givenName: '',
      familyName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = React.useCallback(
    (values: AcceptInviteSchema) => {
      const formData = new FormData();
      formData.set('inviteToken', values.inviteToken);
      formData.set('givenName', values.givenName);
      formData.set('familyName', values.familyName);
      formData.set('password', values.password);
      formData.set('confirmPassword', values.confirmPassword);

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Complete your account</h1>
        <p className="text-muted-foreground text-sm">Set up your profile and password to activate your access.</p>
      </header>

      {actionData?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          <input type="hidden" name="inviteToken" value={inviteToken} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="givenName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="familyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="family-name" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}
