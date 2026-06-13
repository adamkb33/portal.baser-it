import { Form, useLoaderData, useNavigation } from 'react-router';
import { Mail } from 'lucide-react';
import { Button, Input, PageHeader, Panel, Stack } from '~/ui';
import type { createBookingContactCollectEmailLoader } from './booking.contact.collect-email.loader';
import { BOOKING_CONTACT_PAGE_HEADER_CLASS, BOOKING_CONTACT_PANEL_CLASS } from '../_utils/booking-contact-theme';

export function BookingContactCollectEmailPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactCollectEmailLoader>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Legg til e-post"
        description="E-post er valgfritt. Du kan fortsette uten e-post hvis mobilnummeret ditt er bekreftet."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />

      <Panel title="E-post" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <Stack space="xs">
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="E-post (valgfritt)"
                defaultValue={loaderData.email || undefined}
                disabled={isSubmitting}
                variant="booking"
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
              <Mail className="size-5" />
              Lagre og fortsett
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
