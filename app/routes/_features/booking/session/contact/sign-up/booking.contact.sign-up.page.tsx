import { Form, Link, useLoaderData, useNavigation } from 'react-router';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { Button, Input, Label, PageHeader, Panel, Stack, Text } from '~/ui';
import type { createBookingContactSignUpLoader } from './booking.contact.sign-up.loader';
import {
  BOOKING_CONTACT_LABEL_CLASS,
  BOOKING_CONTACT_PAGE_HEADER_CLASS,
  BOOKING_CONTACT_PANEL_CLASS,
} from '../_utils/booking-contact-theme';

export function BookingContactSignUpPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactSignUpLoader>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Opprett konto"
        description="Opprett en konto for å fortsette booking."
        className={BOOKING_CONTACT_PAGE_HEADER_CLASS}
      />
      <div>
        <Link
          to={loaderData.contactHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-booking-text-muted hover:text-booking-text"
        >
          <ChevronLeft className="size-4" />
          Tilbake til kontakt
        </Link>
      </div>

      <Panel title="Opprett konto" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <input type="hidden" name="redirectUrl" value="booking" />

            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <Stack space="xs">
                <Label htmlFor="givenName" className={BOOKING_CONTACT_LABEL_CLASS}>
                  Fornavn
                </Label>
                <Input
                  id="givenName"
                  name="givenName"
                  autoComplete="given-name"
                  required
                  disabled={isSubmitting}
                  placeholder="Fornavn"
                  defaultValue={loaderData.defaults.givenName}
                  variant="booking"
                />
              </Stack>

              <Stack space="xs">
                <Label htmlFor="familyName" className={BOOKING_CONTACT_LABEL_CLASS}>
                  Etternavn
                </Label>
                <Input
                  id="familyName"
                  name="familyName"
                  autoComplete="family-name"
                  required
                  disabled={isSubmitting}
                  placeholder="Etternavn"
                  defaultValue={loaderData.defaults.familyName}
                  variant="booking"
                />
              </Stack>
            </div>

            <Stack space="xs">
              <Label htmlFor="email" className={BOOKING_CONTACT_LABEL_CLASS}>
                E-post
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                disabled={isSubmitting}
                placeholder="E-post"
                defaultValue={loaderData.defaults.email}
                variant="booking"
              />
              <Text as="p" variant="caption" className="text-booking-text-muted">
                Valgfritt. Legg inn e-post hvis du også vil motta bekreftelse på e-post.
              </Text>
            </Stack>

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
                disabled={isSubmitting}
                placeholder="Mobilnummer"
                defaultValue={loaderData.defaults.mobileNumber}
                variant="booking"
              />
              <Text as="p" variant="caption" className="text-booking-text-muted">
                Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.
              </Text>
            </Stack>

            <Stack space="xs">
              <Label htmlFor="password" className={BOOKING_CONTACT_LABEL_CLASS}>
                Passord
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                variant="booking"
              />
            </Stack>

            <Stack space="xs">
              <Label htmlFor="password2" className={BOOKING_CONTACT_LABEL_CLASS}>
                Bekreft passord
              </Label>
              <Input
                id="password2"
                name="password2"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                variant="booking"
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
              <UserPlus className="size-5" />
              Opprett konto
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
