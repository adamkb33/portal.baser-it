// auth.forgot-password.route.tsx (refactored)
import { Form, Link, useNavigation } from 'react-router';
import type { Route } from './+types/auth.forgot-password.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthFormContainer } from '../_components/auth.form-container';
import { AuthFormField } from '../_components/auth.form-field';
import { AuthFormButton } from '../_components/auth.form-button';
import { AuthController } from '~/api/generated/identity';
import { redirectWithInfo } from '~/routes/company/_lib/flash-message.server';
import { apiRouteHandler } from '~/lib/api-route-handler';

const withEmailValue = (error: unknown, email: string) => {
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    if ('error' in record) {
      return { ...record, values: { email } };
    }
    return { ...record, error, values: { email } };
  }

  return { error, values: { email } };
};

export const action = apiRouteHandler.action(
  async ({ request }, { requestApi }) => {
    const formData = await request.formData();
    const email = String(formData.get('email'));

    try {
      await requestApi(
        AuthController.forgotPassword({
          body: { email },
        }),
      );

      return redirectWithInfo(request, '/', 'Vi har sendt deg en e-post');
    } catch (error) {
      throw withEmailValue(error, email);
    }
  },
  {
    fallbackMessage: 'Noe gikk galt. Prøv igjen.',
    mapError: (_payload, error) => ({
      values: (error as { values?: { email: string } }).values ?? { email: '' },
    }),
  },
);

export default function AuthForgotPassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const actionHasOk = !!actionData && 'ok' in actionData;
  const errorMessage = actionHasOk && !actionData.ok ? actionData.error.message : undefined;
  const actionValues =
    actionHasOk && !actionData.ok && 'values' in actionData
      ? (actionData as { values?: { email?: string } }).values
      : undefined;

  return (
    <AuthFormContainer
      title="Glemt passord"
      description="Oppgi din e-post for å tilbakestille ditt passord. Følg lenken du får tilsendt på din e-post adresse."
      error={errorMessage}
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
          defaultValue={actionValues?.email}
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
