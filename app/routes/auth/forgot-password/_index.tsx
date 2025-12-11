import * as React from 'react';
import { Link, redirect, useSubmit, useNavigation } from 'react-router';
import type { Route } from './+types/_index';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { forgotPasswordSchema, type ForgotPasswordSchema } from './_schemas/forgot-password-form.schema';
import type { ApiClientError } from '~/api/clients/http';
import { AuthControllerService } from '~/api/clients/base';
import { ROUTES_MAP } from '~/lib/route-tree';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));

  try {
    await AuthControllerService.forgotPassword({
      requestBody: { email },
    });

    return redirect('/');
  } catch (error: any) {
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function AuthForgotPasswordRoute({ actionData }: Route.ComponentProps) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = React.useCallback(
    (values: ForgotPasswordSchema) => {
      const formData = new FormData();
      formData.set('email', values.email);

      submit(formData, { method: 'post' });
    },
    [submit],
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-post</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="din@e-post.no"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Behandler…' : 'Send kode for tilbakestilling'}
          </Button>
        </form>
      </Form>

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
