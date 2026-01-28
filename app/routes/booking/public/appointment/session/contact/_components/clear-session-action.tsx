import { useFetcher } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ACTION_INTENT } from '../booking.public.appointment.session.contact.route';

export function ClearSessionAction() {
  const fetcher = useFetcher();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Slett brukerdata</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fjern brukerinfo fra bookingøkten?</AlertDialogTitle>
          <AlertDialogDescription>
            Dette vil slette brukerinformasjon og data som er lagt inn i denne bookingøkten. Du kan ikke angre.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <fetcher.Form method="post" action="?index">
            <input type="hidden" name="intent" value={ACTION_INTENT.CLEAR_SESSION} />
            <AlertDialogAction type="submit">Slett</AlertDialogAction>
          </fetcher.Form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
