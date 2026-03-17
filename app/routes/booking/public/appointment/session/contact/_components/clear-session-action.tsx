import { useFetcher, useLocation } from 'react-router';
import * as React from 'react';
import { ACTION_INTENT } from '../_utils/action-intents';
import { Button, ConfirmDialog } from '~/ui';

export function ClearSessionAction() {
  const fetcher = useFetcher();
  const location = useLocation();
  const action = `${location.pathname}${location.search}`;
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        Slett brukerdata
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Fjern brukerinfo fra bookingøkten?"
        description="Dette vil slette brukerinformasjon og data som er lagt inn i denne bookingøkten. Du kan ikke angre."
        cancelAction={
          <Button type="button" variant="outline">
            Avbryt
          </Button>
        }
        confirmAction={
          <fetcher.Form method="post" action={action}>
            <input type="hidden" name="intent" value={ACTION_INTENT.CLEAR_SESSION} />
            <Button type="submit" variant="destructive">
              Slett
            </Button>
          </fetcher.Form>
        }
      />
    </>
  );
}
