import { Form, useLoaderData, useNavigation } from 'react-router';
import { Smartphone } from 'lucide-react';
import { Button, Input, Label, PageHeader, Panel, Stack, Text } from '~/ui';
import type { createBookingContactCollectMobileLoader } from './booking.contact.collect-mobile.loader';
import {
  BOOKING_CONTACT_LABEL_CLASS,
  BOOKING_CONTACT_PAGE_HEADER_CLASS,
  BOOKING_CONTACT_PANEL_CLASS,
} from '../_utils/booking-contact-theme';

export function BookingContactCollectMobilePage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactCollectMobileLoader>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Legg til ditt mobilnummer"
        description="Mobilnummer er påkrevd for å bestille time."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />

      <Panel title="Mobilnummer" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <Stack space="xs">
              <Label htmlFor="mobileNumber" className={BOOKING_CONTACT_LABEL_CLASS}>
                Mobilnummer
              </Label>
              <Input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                defaultValue={loaderData.mobileNumber || undefined}
                disabled={isSubmitting}
                variant="booking"
              />
              <Text as="p" variant="caption" className="text-booking-text-muted">
                Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.
              </Text>
            </Stack>

            <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
              <Smartphone className="size-5" />
              Fortsett
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
