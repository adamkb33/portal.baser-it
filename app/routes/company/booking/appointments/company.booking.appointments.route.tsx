import { NavLink, useFetcher, useNavigate, useSearchParams } from 'react-router';
import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { withAuth } from '~/api/utils/with-auth';
import { CompanyUserAppointmentController, type AppointmentDto } from '~/api/generated/booking';
import type { Route } from './+types/company.booking.appointments.route';
import { AppointmentCardRow } from './_components/appointment.card-row';
import { AppointmentTableHeaderSlot } from './_components/appointment.table-header-slot';
import { AppointmentTableRow } from './_components/appointment.table-row';
import { AppointmentPaginationService } from './_services/appointment.pagination-service';
import { resolveErrorPayload } from '~/lib/api-error';
import { redirectWithError, redirectWithSuccess } from '~/lib/flash-message.server';
import { formatCurrentDateTimeInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CompanyPageTemplate,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  KeyValueList,
  Label,
  Notice,
  Text,
  Textarea,
} from '~/ui';
import { getTotalDuration, getTotalPrice, getTotalServiceCount, isAppointmentCompleted } from './_utils/appointments.utils';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const sort = url.searchParams.get('sort') || '';
    const search = url.searchParams.get('search')?.trim() || undefined;
    const fromDateTime = url.searchParams.get('fromDateTime');
    const toDateTime = url.searchParams.get('toDateTime');
    const direction = url.searchParams.get('direction') as 'ASC' | 'DESC' | null;

    const hasDateFilters = fromDateTime !== null || toDateTime !== null;
    const now = formatCurrentDateTimeInTimeZone();
    const effectiveFromDateTime = hasDateFilters ? fromDateTime : now;
    const effectiveToDateTime = hasDateFilters ? toDateTime : null;

    const appointmentsResponse = await withAuth(request, async () => {
      return CompanyUserAppointmentController.getAppointments({
        query: {
          page,
          size,
          ...(sort && { sort }),
          ...(search ? { search } : {}),
          ...(effectiveFromDateTime && { fromDateTime: effectiveFromDateTime }),
          ...(effectiveToDateTime && { toDateTime: effectiveToDateTime }),
          direction: direction || 'ASC',
        },
      });
    });

    const apiResponse = appointmentsResponse.data;
    const pageData = apiResponse?.data;

    return {
      appointments: pageData?.content || [],
      pagination: {
        page: pageData?.page ?? 0,
        size: pageData?.size ?? size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente timebestillinger');
    return {
      appointments: [],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      },
      error: message,
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
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
      await withAuth(request, async () => {
        return CompanyUserAppointmentController.deleteAppointment({
          path: { id: Number(id) },
          body: { reason },
        });
      });

      return redirectWithSuccess(request, request.url, 'Timebestilling slettet');
    } catch (error) {
      const { message } = resolveErrorPayload(error, 'Kunne ikke slette timebestilling');
      return redirectWithError(request, request.url, message);
    }
  }

  return redirectWithError(request, request.url, 'Ukjent handling');
}

export default function CompanyBookingAppointmentsPage({ loaderData }: Route.ComponentProps) {
  const { appointments, pagination, error } = loaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [selectedSpotlightAppointment, setSelectedSpotlightAppointment] = useState<AppointmentDto | null>(null);
  const [isSpotlightDetailsOpen, setIsSpotlightDetailsOpen] = useState(false);

  const paginationService = useMemo(
    () => new AppointmentPaginationService(searchParams, navigate),
    [searchParams, navigate],
  );

  const now = useMemo(() => new Date(), [appointments]);
  const sortedByStart = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [appointments],
  );

  const ongoingAppointment = useMemo(
    () => sortedByStart.find((appointment) => isAppointmentInProgress(appointment, now)) ?? null,
    [sortedByStart, now],
  );
  const lastCompletedAppointment = useMemo(
    () =>
      [...appointments]
        .filter((appointment) => isAppointmentPast(appointment, now))
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0] ?? null,
    [appointments, now],
  );
  const nextUpcomingAppointment = useMemo(
    () =>
      sortedByStart.find((appointment) => new Date(appointment.startTime).getTime() >= now.getTime()) ??
      null,
    [sortedByStart, now],
  );

  const handleDeleteClick = (id: number) => {
    const appointment = appointments.find((item) => item.id === id);
    if (!appointment || isAppointmentCompleted(appointment)) {
      return;
    }

    setDeletingAppointmentId(id);
    setDeleteReason('');
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAppointmentId) return;
    const trimmedReason = deleteReason.trim();
    if (!trimmedReason) {
      return;
    }
    const deletingAppointment = appointments.find((appointment) => appointment.id === deletingAppointmentId);
    if (!deletingAppointment) return;

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(deletingAppointmentId));
    fd.append('startTime', deletingAppointment.startTime);
    fd.append('reason', trimmedReason);

    setIsDeleteDialogOpen(false);
    fetcher.submit(fd, { method: 'post' });
  };

  const handleDeleteDialogOpenChange = (next: boolean) => {
    setIsDeleteDialogOpen(next);
    if (!next && fetcher.state === 'idle') {
      setDeletingAppointmentId(null);
      setDeleteReason('');
    }
  };

  const openSpotlightDetails = (appointment: AppointmentDto) => {
    setSelectedSpotlightAppointment(appointment);
    setIsSpotlightDetailsOpen(true);
  };

  const openUploadImagePage = (appointmentId: number) => {
    const href = `${ROUTES_MAP['company.booking.appointments.upload-image'].href}?id=${appointmentId}`;
    navigate(href);
  };

  return (
    <>
      <CompanyPageTemplate
        title="Timebestillinger"
        description="Hold oversikten over kommende og fullførte avtaler i den samme kompakte booking-layouten."
        routeLinks={
          <>
            <Button asChild variant="outline" size="sm">
              <NavLink to={ROUTES_MAP['company.booking'].href}>Oversikt</NavLink>
            </Button>
            <Button asChild variant="outline" size="sm">
              <NavLink to={ROUTES_MAP['company.booking.admin'].href}>Administrasjon</NavLink>
            </Button>
          </>
        }
        actions={
          <Button asChild>
            <NavLink to={ROUTES_MAP['company.booking.appointments.create'].href}>Ny time</NavLink>
          </Button>
        }
        hero={
          ongoingAppointment || lastCompletedAppointment || nextUpcomingAppointment ? (
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {ongoingAppointment ? (
                <SpotlightAppointmentCard
                  title="Pågående avtale"
                  hint="Pågår nå"
                  appointment={ongoingAppointment}
                  tone="ongoing"
                  onOpen={openSpotlightDetails}
                />
              ) : lastCompletedAppointment ? (
                <SpotlightAppointmentCard
                  title="Siste fullførte avtale"
                  hint="Sist gjennomført"
                  appointment={lastCompletedAppointment}
                  tone="recent"
                  onOpen={openSpotlightDetails}
                />
              ) : nextUpcomingAppointment ? (
                <SpotlightAppointmentCard
                  title="Neste avtale"
                  hint="Kommende"
                  appointment={nextUpcomingAppointment}
                  tone="upcoming"
                  onOpen={openSpotlightDetails}
                />
              ) : null}

              {ongoingAppointment && lastCompletedAppointment ? (
                <SpotlightAppointmentCard
                  title="Siste fullførte avtale"
                  hint="Sist gjennomført"
                  appointment={lastCompletedAppointment}
                  tone="recent"
                  onOpen={openSpotlightDetails}
                />
              ) : null}
            </div>
          ) : null
        }
      >
        {error ? (
          <Notice tone="emphasis" title="Kunne ikke hente timebestillinger" message={error} />
        ) : (
          <ServerPaginatedTable<AppointmentDto>
            items={appointments}
            columns={[
              { header: 'Tidspunkt', className: 'font-medium' },
              { header: 'Kunde' },
              { header: 'Tjenester' },
              { header: 'Varighet' },
              { header: 'Pris' },
              { header: 'Handlinger' },
            ]}
            pagination={pagination}
            onPageChange={paginationService.handlePageChange}
            onPageSizeChange={paginationService.handlePageSizeChange}
            emptyMessage="Ingen avtaler ennå"
            getRowKey={(appointment, index) => appointment.id ?? `appointment-${index}`}
            renderMobileCard={(appointment, index) => (
              <AppointmentCardRow
                appointment={appointment}
                index={index}
                onDelete={handleDeleteClick}
                onUploadImage={openUploadImagePage}
                isDeleting={fetcher.state !== 'idle' && deletingAppointmentId === appointment.id}
              />
            )}
            headerSlot={<AppointmentTableHeaderSlot />}
            mobileHeaderSlot={<AppointmentTableHeaderSlot />}
            renderRow={(appointment) => (
              <AppointmentTableRow
                appointment={appointment}
                onDelete={handleDeleteClick}
                onUploadImage={openUploadImagePage}
                isDeleting={fetcher.state !== 'idle' && deletingAppointmentId === appointment.id}
              />
            )}
          />
        )}

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
          onConfirm={handleDeleteConfirm}
          title="Slett timebestilling?"
          description="Er du sikker på at du vil slette denne timebestillingen? Denne handlingen kan ikke angres."
          confirmDisabled={fetcher.state !== 'idle' || deleteReason.trim().length === 0}
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
              disabled={fetcher.state !== 'idle'}
              required
            />
          </div>
        </DeleteConfirmDialog>
      </CompanyPageTemplate>

      <SpotlightAppointmentDetailsDialog
        appointment={selectedSpotlightAppointment}
        onUploadImage={openUploadImagePage}
        onDelete={(id) => {
          setIsSpotlightDetailsOpen(false);
          setSelectedSpotlightAppointment(null);
          handleDeleteClick(id);
        }}
        isDeleting={fetcher.state !== 'idle' && deletingAppointmentId === selectedSpotlightAppointment?.id}
        open={isSpotlightDetailsOpen}
        onOpenChange={(next) => {
          setIsSpotlightDetailsOpen(next);
          if (!next) setSelectedSpotlightAppointment(null);
        }}
      />
    </>
  );
}

function isAppointmentInProgress(appointment: AppointmentDto, now: Date): boolean {
  const start = new Date(appointment.startTime).getTime();
  const end = new Date(appointment.endTime).getTime();
  const current = now.getTime();
  return current >= start && current <= end;
}

function isAppointmentPast(appointment: AppointmentDto, now: Date): boolean {
  return new Date(appointment.endTime).getTime() < now.getTime();
}

function SpotlightAppointmentCard({
  title,
  hint,
  appointment,
  tone,
  onOpen,
}: {
  title: string;
  hint: string;
  appointment: AppointmentDto;
  tone: 'ongoing' | 'recent' | 'upcoming';
  onOpen: (appointment: AppointmentDto) => void;
}) {
  const toneClasses: Record<
    'ongoing' | 'recent' | 'upcoming',
    { card: string; chip: string; bar: string; orb: string; inner: string }
  > = {
    ongoing: {
      card: 'border-primary/30 bg-surface-primary-subtle',
      chip: 'border-primary/30 bg-surface-primary-strong text-primary',
      bar: 'bg-primary/85',
      orb: 'bg-primary/20',
      inner: 'bg-background/80',
    },
    recent: {
      card: 'border-tertiary/35 bg-surface-tertiary-subtle',
      chip: 'border-tertiary/35 bg-surface-tertiary-strong text-tertiary',
      bar: 'bg-tertiary/80',
      orb: 'bg-tertiary/20',
      inner: 'bg-background/75',
    },
    upcoming: {
      card: 'border-secondary/35 bg-surface-secondary-subtle',
      chip: 'border-secondary/35 bg-surface-secondary-strong text-secondary',
      bar: 'bg-secondary/80',
      orb: 'bg-secondary/20',
      inner: 'bg-background/78',
    },
  };

  return (
    <Card className={`relative overflow-hidden rounded-xl ${toneClasses[tone].card}`}>
      <div className={`h-1 w-full ${toneClasses[tone].bar}`} />
      <div className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-xl ${toneClasses[tone].orb}`} />
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <Text as="p" variant="body-sm" className="font-semibold">
            {title}
          </Text>
          <Badge variant="outline" size="sm" className={`rounded-full text-[11px] ${toneClasses[tone].chip}`}>
            {hint}
          </Badge>
        </div>

        <button
          type="button"
          onClick={() => onOpen(appointment)}
          className={`w-full rounded-lg border border-border p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm ${toneClasses[tone].inner}`}
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <Text as="p" variant="body-sm" className="truncate font-semibold">
                {appointment.user.givenName} {appointment.user.familyName}
              </Text>
              <Text as="p" variant="caption" className="text-text-secondary">
                {format(parseISO(appointment.startTime), "EEE d. MMM 'kl.' HH:mm", { locale: nb })}
              </Text>
            </div>
            <div className="text-right text-xs">
              <Text as="p" variant="caption" className="text-text-secondary">
                Varighet
              </Text>
              <Text as="p" variant="caption" className="font-semibold text-text-primary">
                {getTotalDuration(appointment)}
              </Text>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}

function SpotlightAppointmentDetailsDialog({
  appointment,
  onUploadImage,
  onDelete,
  isDeleting,
  open,
  onOpenChange,
}: {
  appointment: AppointmentDto | null;
  onUploadImage: (appointmentId: number) => void;
  onDelete: (appointmentId: number) => void;
  isDeleting?: boolean;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  if (!appointment) return null;

  const totalServices = getTotalServiceCount(appointment);
  const isCompleted = isAppointmentCompleted(appointment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avtaledetaljer</DialogTitle>
          <DialogDescription>
            {format(parseISO(appointment.startTime), 'PPPp', { locale: nb })} · {totalServices}{' '}
            {totalServices === 1 ? 'tjeneste' : 'tjenester'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUploadImage(appointment.id)}
            >
              Last opp bilde
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(appointment.id)}
              disabled={isDeleting || isCompleted}
              title={isCompleted ? 'Fullførte avtaler kan ikke slettes' : undefined}
            >
              Slett
            </Button>
          </div>

          <div className="space-y-2">
            <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
              Kunde
            </Text>
            <Text as="p" variant="body-sm" className="mt-1 font-semibold">
              {appointment.user.givenName} {appointment.user.familyName}
            </Text>
            <div className="mt-2 text-sm text-text-secondary">{appointment.user.email || 'Ingen e-post registrert'}</div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
              Oppsummering
            </Text>
            <KeyValueList
              layout="compact"
              items={[
                { label: 'Tjenester', value: totalServices },
                { label: 'Varighet', value: getTotalDuration(appointment) },
                { label: 'Pris', value: getTotalPrice(appointment) },
              ]}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
