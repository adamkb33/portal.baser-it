import { Form, Link, useLoaderData, useNavigation } from 'react-router';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { Button, Input, Label, PageHeader, Panel, Stack } from '~/ui';
import type { createBookingContactSignUpLoader } from './booking.contact.sign-up.loader';

export function BookingContactSignUpPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactSignUpLoader>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader label="Kontakt" title="Opprett konto" description="Opprett en konto for å fortsette booking." />
      <div>
        <Link
          to={loaderData.contactHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-booking-text-muted hover:text-booking-text"
        >
          <ChevronLeft className="size-4" />
          Tilbake til kontakt
        </Link>
      </div>

      <Panel title="Opprett konto" tone="muted">
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <input type="hidden" name="redirectUrl" value="booking" />

            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <Stack space="xs">
                <Label htmlFor="givenName">Fornavn</Label>
                <Input
                  id="givenName"
                  name="givenName"
                  autoComplete="given-name"
                  required
                  disabled={isSubmitting}
                  placeholder="Fornavn"
                  defaultValue={loaderData.defaults.givenName}
                />
              </Stack>

              <Stack space="xs">
                <Label htmlFor="familyName">Etternavn</Label>
                <Input
                  id="familyName"
                  name="familyName"
                  autoComplete="family-name"
                  required
                  disabled={isSubmitting}
                  placeholder="Etternavn"
                  defaultValue={loaderData.defaults.familyName}
                />
              </Stack>
            </div>

            <Stack space="xs">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                placeholder="E-post"
                defaultValue={loaderData.defaults.email}
              />
            </Stack>

            <Stack space="xs">
              <Label htmlFor="mobileNumber">Mobilnummer</Label>
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
              />
            </Stack>

            <Stack space="xs">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
            </Stack>

            <Stack space="xs">
              <Label htmlFor="password2">Bekreft passord</Label>
              <Input
                id="password2"
                name="password2"
                type="password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth className="gap-3">
              <UserPlus className="size-5" />
              Opprett konto
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
