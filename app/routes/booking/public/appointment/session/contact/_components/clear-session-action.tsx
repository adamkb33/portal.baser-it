import { useFetcher, useLocation } from 'react-router';
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
import { ACTION_INTENT } from '../_utils/action-intents';

export function ClearSessionAction() {
  const fetcher = useFetcher();
  const location = useLocation();
  const action = `${location.pathname}${location.search}`;

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
          <fetcher.Form method="post" action={action}>
            <input type="hidden" name="intent" value={ACTION_INTENT.CLEAR_SESSION} />
            <AlertDialogAction type="submit">Slett</AlertDialogAction>
          </fetcher.Form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
