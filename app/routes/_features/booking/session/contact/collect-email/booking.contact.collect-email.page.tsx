import { Form, useLoaderData, useNavigation } from 'react-router';
import { Mail } from 'lucide-react';
import { Button, Input, PageHeader, Panel, Stack } from '~/ui';
import type { createBookingContactCollectEmailLoader } from './booking.contact.collect-email.loader';

export function BookingContactCollectEmailPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactCollectEmailLoader>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Legg til din e-post"
        description="Vi trenger e-posten din for å fullføre booking."
      />

      <Panel title="E-post" tone="muted">
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <Stack space="xs">
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                defaultValue={loaderData.email || undefined}
                disabled={isSubmitting}
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth className="gap-3">
              <Mail className="size-5" />
              Fortsett
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
