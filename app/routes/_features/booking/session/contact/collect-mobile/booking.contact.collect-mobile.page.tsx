import { Form, useLoaderData, useNavigation } from 'react-router';
import { Smartphone } from 'lucide-react';
import { Button, Input, PageHeader, Panel, Stack } from '~/ui';
import type { createBookingContactCollectMobileLoader } from './booking.contact.collect-mobile.loader';

export function BookingContactCollectMobilePage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingContactCollectMobileLoader>>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Stack space="xl">
      <PageHeader
        label="Kontakt"
        title="Legg til ditt mobilnummer"
        description="Vi trenger ditt mobilnummer for å fullføre booking."
      />

      <Panel title="Mobilnummer" tone="muted">
        <Form method="post" aria-busy={isSubmitting}>
          <Stack space="md">
            <Stack space="xs">
              <Input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={loaderData.mobileNumber || undefined}
                disabled={isSubmitting}
              />
            </Stack>

            <Button type="submit" size="lg" fullWidth className="gap-3">
              <Smartphone className="size-5" />
              Fortsett
            </Button>
          </Stack>
        </Form>
      </Panel>
    </Stack>
  );
}
