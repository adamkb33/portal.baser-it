import { Outlet, useFetcher, useRouteLoaderData } from 'react-router';
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
import { ACTION_INTENT } from './booking.public.appointment.session.contact.route';

type ContactLoaderData = {
  session: { userId?: number | null } | null;
};

export default function BookingPublicAppointmentSessionContactLayout() {
  const data = useRouteLoaderData('routes/booking/public/appointment/session/contact/booking.public.appointment.session.contact.route') as
    | ContactLoaderData
    | null;
  const fetcher = useFetcher();
  const hasSessionUser = Boolean(data?.session?.userId);

  return (
    <>
      <Outlet />
      {hasSessionUser ? (
        <div className="fixed bottom-4 right-4 z-40">
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
        </div>
      ) : null}
    </>
  );
}
