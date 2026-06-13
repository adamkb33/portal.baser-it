import * as React from 'react';
import { Form, Link, useLoaderData, useLocation, useNavigation } from 'react-router';
import { ChevronLeft, LogIn } from 'lucide-react';
import { ProviderButtons } from '~/routes/auth/_components/provider-buttons';
import { Button, Input, Label, PageHeader, Panel, Stack } from '~/ui';
import type { createBookingContactSignInLoader } from './booking.contact.sign-in.loader';
import {
  BOOKING_CONTACT_LABEL_CLASS,
  BOOKING_CONTACT_PAGE_HEADER_CLASS,
  BOOKING_CONTACT_PANEL_CLASS,
} from '../_utils/booking-contact-theme';

export function BookingContactSignInPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactSignInLoader>>();
  const navigation = useNavigation();
  const location = useLocation();
  const isSubmitting = navigation.state === 'submitting';
  const [email, setEmail] = React.useState<string | null>(loaderData.email || null);
  const isGoogleProvider = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('provider') === 'GOOGLE';
  }, [location.search]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email') || '';
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.search]);

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Logg inn"
        description="Logg inn for å fortsette booking."
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

      <Panel title="Logg inn med e-post" tone="muted" className={BOOKING_CONTACT_PANEL_CLASS}>
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <ProviderButtons showDivider={!isGoogleProvider} />
            <input type="hidden" name="redirectUrl" value="booking" />

            {!isGoogleProvider ? (
              <>
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
                    value={email || undefined}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    variant="booking"
                  />
                </Stack>

                <Stack space="xs">
                  <Label htmlFor="password" className={BOOKING_CONTACT_LABEL_CLASS}>
                    Passord
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    variant="booking"
                  />
                </Stack>

                <Button type="submit" size="lg" fullWidth variant="booking-primary" className="gap-3">
                  <LogIn className="size-5" />
                  Logg inn
                </Button>
              </>
            ) : null}
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
