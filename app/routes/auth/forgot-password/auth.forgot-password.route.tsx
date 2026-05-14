// auth.forgot-password.route.tsx (refactored)
import { Form, Link, data, useNavigation } from 'react-router';
import type { Route } from './+types/auth.forgot-password.route';

import { ROUTES_MAP } from '~/lib/route-tree';
import { AuthController } from '~/api/generated/base';
import { redirectWithError, redirectWithInfo } from '~/lib/flash-message.server';
import { resolveErrorPayload } from '~/lib/api-error';
import { Button, FormField, FormPageTemplate } from '~/ui';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email'));

  try {
    await AuthController.forgotPassword({
      body: { email },
    });

    return redirectWithInfo(request, '/', 'Vi har sendt deg en e-post');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Noe gikk galt. Prøv igjen.');
    return redirectWithError(request, ROUTES_MAP['auth.forgot-password'].href, message);
  }
}

export default function AuthForgotPassword({}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <FormPageTemplate
      title="Glemt passord"
      description="Oppgi din e-post for å tilbakestille ditt passord. Følg lenken du får tilsendt på din e-post adresse."
      variant="subtle"
      actions={
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
      footerLink={null}
    >
      <Form method="post" className="space-y-6">
        <FormField
          id="email"
          name="email"
          label="E-post adresse"
          type="email"
          autoComplete="email"
          placeholder="e-post"
          required
          disabled={isSubmitting}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          Send tilbakestillingskode
        </Button>
      </Form>
    </FormPageTemplate>
  );
}
