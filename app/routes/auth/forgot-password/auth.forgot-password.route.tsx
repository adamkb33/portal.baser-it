// auth.forgot-password.route.tsx (refactored)
import { Form, Link, redirect, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.forgot-password.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { AuthController } from '~/api/generated/identity';
import { redirectWithInfo } from '~/routes/company/_lib/flash-message.server';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));

  try {
    await AuthController.forgotPassword({
      body: { email },
    });

    return redirectWithInfo(request, '/', 'Vi har sendt deg en e-post');
  } catch (error: any) {
    console.error('[forgot-password] Error:', error);

    if (error as unknown as { body?: { message?: string } }) {
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

export default function AuthForgotPassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <AuthFormContainer
      title="Glemt passord"
      description="Oppgi din e-post for å tilbakestille ditt passord. Følg lenken du får tilsendt på din e-post adresse."
      error={actionData?.error}
      secondaryAction={
        <>
          <Link
            to={ROUTES_MAP['auth.sign-in'].href}
            className="block text-center text-sm font-medium text-foreground hover:underline"
          >
            ← Tilbake til innlogging
          </Link>
          <Link to="/" className="mt-2 block text-center text-sm font-medium text-muted-foreground hover:underline">
            Hovedsiden →
          </Link>
        </>
      }
    >
      <Form method="post" className="space-y-6">
        <AuthFormField
          id="email"
          name="email"
          label="E-post adresse"
          type="email"
          autoComplete="email"
          placeholder="din@e-post.no"
          defaultValue={actionData?.values?.email}
          required
          disabled={isSubmitting}
        />

        <AuthFormButton isLoading={isSubmitting} loadingText="Behandler…">
          Send tilbakestillingskode
        </AuthFormButton>
      </Form>
    </AuthFormContainer>
  );
}
