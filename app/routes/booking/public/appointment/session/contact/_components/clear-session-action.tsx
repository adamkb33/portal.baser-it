import { useFetcher, useLocation } from 'react-router';
import * as React from 'react';
import { ACTION_INTENT } from '~/routes/booking/public/appointment/session/contact/_utils/action-intents';
import { Button, ConfirmDialog } from '~/ui';

export function ClearSessionAction() {
  const fetcher = useFetcher();
  const location = useLocation();
  const action = `${location.pathname}${location.search}`;
  const [open, setOpen] = React.useState(false);
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)} disabled={isSubmitting}>
        Slett brukerdata
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Fjern brukerinfo fra bookingøkten?"
        description="Dette vil slette brukerinformasjon og data som er lagt inn i denne bookingøkten. Du kan ikke angre."
        cancelAction={
          <Button type="button" variant="booking-secondary">
            Avbryt
          </Button>
        }
        confirmAction={
          <fetcher.Form method="post" action={action} aria-busy={isSubmitting}>
            <input type="hidden" name="intent" value={ACTION_INTENT.CLEAR_SESSION} />
            <Button type="submit" variant="destructive" loading={isSubmitting}>
              {isSubmitting ? 'Sletter...' : 'Slett'}
            </Button>
          </fetcher.Form>
        }
      />
    </>
  );
}
