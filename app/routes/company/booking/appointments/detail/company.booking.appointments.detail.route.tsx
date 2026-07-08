import { Link, data, useFetcher, useNavigate } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import type { Route } from './+types/company.booking.appointments.detail.route';
import { CompanyUserAppointmentController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithSuccess } from '~/lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, Label, Notice, Textarea } from '~/ui';
import { AppointmentDetailsContent } from '../_components/appointment-details-content';
import { isAppointmentCompleted } from '../_utils/appointments.utils';

export function parseAppointmentRouteId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const appointmentId = parseAppointmentRouteId(params.appointmentId);

  if (!appointmentId) {
    return data({ appointment: null, error: 'Ugyldig timebestilling' }, { status: 400 });
  }

  try {
    const response = await withAuth(request, () =>
      CompanyUserAppointmentController.getAppointmentById1({
        path: { id: appointmentId },
      }),
    );

    const appointment = response.data?.data ?? null;

    if (!appointment) {
      return data({ appointment: null, error: 'Fant ikke timebestillingen' }, { status: 404 });
    }

    return data({ appointment, error: null as string | null });
  } catch (error) {
    const { status, message } = resolveErrorPayload(error, 'Kunne ikke hente timebestilling');

    if (status === 401) {
      throw error;
    }

    if (status === 403) {
      return data({ appointment: null, error: 'Du har ikke tilgang til denne timebestillingen' }, { status: 403 });
    }

    if (status === 404) {
      return data({ appointment: null, error: 'Fant ikke timebestillingen' }, { status: 404 });
    }

    return data({ appointment: null, error: message }, { status: status ?? 400 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent !== 'delete') {
    return redirectWithError(request, request.url, 'Ukjent handling');
  }

  const id = formData.get('id');
  const startTime = formData.get('startTime')?.toString();
  const reason = formData.get('reason')?.toString().trim();

  if (!id) {
    return redirectWithError(request, request.url, 'Mangler ID');
  }

  if (!startTime) {
    return redirectWithError(request, request.url, 'Mangler tidspunkt for avtalen');
  }

  if (!reason) {
    return redirectWithError(request, request.url, 'Skriv en årsak til slettingen');
  }

  if (isAppointmentCompleted({ startTime })) {
    return redirectWithError(request, request.url, 'Fullførte avtaler kan ikke slettes');
  }

  try {
    await withAuth(request, () =>
      CompanyUserAppointmentController.deleteAppointment({
        path: { id: Number(id) },
        body: { reason },
      }),
    );

    return redirectWithSuccess(request, ROUTES_MAP['company.booking.appointments'].href, 'Timebestilling slettet');
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke slette timebestilling');
    return redirectWithError(request, request.url, message);
  }
}

export default function CompanyBookingAppointmentDetailPage({ loaderData }: Route.ComponentProps) {
  const { appointment, error } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const isDeleting = fetcher.state !== 'idle';
  const isCompleted = appointment ? isAppointmentCompleted(appointment) : false;

  const openUploadImagePage = () => {
    if (!appointment?.id) {
      return;
    }

    navigate(`${ROUTES_MAP['company.booking.appointments.upload-image'].href}?id=${appointment.id}`);
  };

  const handleDeleteConfirm = () => {
    if (!appointment?.id || !deleteReason.trim()) {
      return;
    }

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(appointment.id));
    fd.append('startTime', appointment.startTime);
    fd.append('reason', deleteReason.trim());

    setIsDeleteDialogOpen(false);
    fetcher.submit(fd, { method: 'post' });
  };

  return (
    <CompanyPageTemplate
      title="Timebestilling"
      description="Detaljvisning for én timebestilling i company booking."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES_MAP['company.booking.appointments'].href}>
            <ArrowLeft className="h-4 w-4" />
            Tilbake til timebestillinger
          </Link>
        </Button>
      }
    >
      {error || !appointment ? (
        <Notice
          tone="emphasis"
          title={error ?? 'Fant ikke timebestillingen'}
          message="Gå tilbake til oversikten for å se tilgjengelige timebestillinger."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES_MAP['company.booking.appointments'].href}>Til oversikt</Link>
            </Button>
          }
        />
      ) : (
        <>
          <AppointmentDetailsContent
            appointment={appointment}
            actions={
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={openUploadImagePage}>
                  <ImagePlus className="h-4 w-4" />
                  Last opp bilde
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting || isCompleted}
                  title={isCompleted ? 'Fullførte avtaler kan ikke slettes' : undefined}
                >
                  <Trash2 className="h-4 w-4" />
                  Slett
                </Button>
              </div>
            }
          />

          <DeleteConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={(next) => {
              setIsDeleteDialogOpen(next);
              if (!next && fetcher.state === 'idle') {
                setDeleteReason('');
              }
            }}
            onConfirm={handleDeleteConfirm}
            title="Slett timebestilling?"
            description="Er du sikker på at du vil slette denne timebestillingen? Denne handlingen kan ikke angres."
            confirmDisabled={isDeleting || deleteReason.trim().length === 0}
          >
            <div className="grid gap-2">
              <Label htmlFor="delete-appointment-reason">Årsak til sletting</Label>
              <Textarea
                id="delete-appointment-reason"
                name="reason"
                size="sm"
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Skriv kort hvorfor avtalen slettes"
                className="rounded-md"
                disabled={isDeleting}
                required
              />
            </div>
          </DeleteConfirmDialog>
        </>
      )}
    </CompanyPageTemplate>
  );
}
