import { data, Link, useNavigate, useNavigation, useSearchParams } from 'react-router';
import type { Route } from './+types/booking.public.my-appointments.route';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { AppointmentsController, type MyAppointmentDto } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { authService } from '~/lib/auth-service';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { getBookingRouteHref } from '~/routes/booking/public/_utils/booking.route-map';
import {
  Badge,
  Button,
  Card as BookingCard,
  Container as BookingContainer,
  Notice,
  PageHeader as BookingPageHeader,
  Panel as BookingSection,
  Stack,
} from '~/ui';
const UPCOMING_BADGE_CLASS = 'border-border bg-muted text-foreground';
const COMPLETED_BADGE_CLASS = 'border-secondary/30 bg-secondary/15 text-foreground';
const APPOINTMENTS_PAGE_SIZE = 5;

type AppointmentPageSection = 'upcoming' | 'completed';

const getSafePage = (value: string | null): number => {
  const page = Number(value || '0');
  return Number.isNaN(page) || page < 0 ? 0 : Math.floor(page);
};

const formatDurationMinutes = (startIso: string, endIso: string): number => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
};

const formatDateParts = (iso: string) => {
  const date = new Date(iso);
  return {
    dayName: new Intl.DateTimeFormat('nb-NO', { weekday: 'long' }).format(date),
    date: new Intl.DateTimeFormat('nb-NO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  };
};

const getGroupedServices = (appointment?: MyAppointmentDto) => appointment?.groupedServiceGroups ?? [];

const flattenServiceNames = (appointment?: MyAppointmentDto) =>
  getGroupedServices(appointment).flatMap((group) => group.services.map((service) => service.name).filter(Boolean));

const buildCalendarPayload = (appointment?: MyAppointmentDto) => {
  if (!appointment) return null;

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const formatIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const companyName = appointment.company.name?.trim() || 'bedrift';
  const summary = `Avtale hos ${companyName}`;
  const serviceNames = flattenServiceNames(appointment);
  const description = serviceNames.length ? `Tjenester: ${serviceNames.join(', ')}` : '';
  const uid = `${appointment.id}-${appointment.startTime}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pitell//Booking//NO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const href = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  const filename = `${companyName}-appointment.ics`.replace(/\s+/g, '-').toLowerCase();
  const googleDates = `${formatIcsDate(startDate)}/${formatIcsDate(endDate)}`;
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    summary,
  )}&dates=${encodeURIComponent(googleDates)}&details=${encodeURIComponent(description)}`;

  return { href, filename, googleUrl };
};

const buildGoogleMapsUrl = (appointment?: MyAppointmentDto) => {
  if (!appointment) return null;

  const address = appointment.company.businessAddress ?? appointment.company.postalAddress;
  if (!address) return null;

  const query = [...(address.addressLines ?? []), address.postalCode, address.city, address.country]
    .filter(Boolean)
    .join(' ');

  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const buildCancelHref = (appointment?: MyAppointmentDto): string | null => {
  if (!appointment) return null;
  return ROUTES_MAP['booking.public.appointment.cancel-by-id'].href.replace(':appointmentId', String(appointment.id));
};

type AppointmentPaginationProps = {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  itemCount: number;
  previousHref: string;
  nextHref: string;
  isLoading: boolean;
};

function AppointmentPagination({
  page,
  pageSize,
  totalElements,
  totalPages,
  hasPrevious,
  hasNext,
  itemCount,
  previousHref,
  nextHref,
  isLoading,
}: AppointmentPaginationProps) {
  if (totalElements === 0) return null;

  const pageCount = Math.max(totalPages, 1);
  const startItem = page * pageSize + 1;
  const endItem = Math.min(page * pageSize + itemCount, totalElements);
  const hasMultiplePages = pageCount > 1;

  return (
    <div className="flex flex-col gap-3 border-t border-card-border pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Viser <span className="font-semibold text-card-text">{startItem}</span>-
        <span className="font-semibold text-card-text">{endItem}</span> av{' '}
        <span className="font-semibold text-card-text">{totalElements}</span>
        <span className="ml-2 text-xs">
          Side {page + 1} av {pageCount}
        </span>
      </p>
      {hasMultiplePages && (
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {hasPrevious && !isLoading ? (
            <Button asChild variant="outline" size="sm">
              <Link to={previousHref}>
                <ChevronLeft className="size-4" />
                Forrige
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              <ChevronLeft className="size-4" />
              Forrige
            </Button>
          )}
          {hasNext && !isLoading ? (
            <Button asChild variant="outline" size="sm">
              <Link to={nextHref}>
                Neste
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              Neste
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  await authService.requireAuth(request, ROUTES_MAP['auth.sign-in'].href);

  try {
    const url = new URL(request.url);
    const safeUpcomingPage = getSafePage(url.searchParams.get('upcomingPage'));
    const safeCompletedPage = getSafePage(url.searchParams.get('completedPage'));

    const [nearestResult, upcomingResult, completedResult] = await withAuth(request, async () => {
      return Promise.allSettled([
        AppointmentsController.getMyNearestAppointment(),
        AppointmentsController.getMyUpcomingAppointments({
          query: {
            page: safeUpcomingPage,
            size: APPOINTMENTS_PAGE_SIZE,
          },
        }),
        AppointmentsController.getMyCompletedAppointments({
          query: {
            page: safeCompletedPage,
            size: APPOINTMENTS_PAGE_SIZE,
          },
        }),
      ]);
    });

    const nearestAppointment = nearestResult.status === 'fulfilled' ? (nearestResult.value.data?.data ?? null) : null;
    const upcomingPayload = upcomingResult.status === 'fulfilled' ? upcomingResult.value.data?.data : undefined;
    const completedPayload = completedResult.status === 'fulfilled' ? completedResult.value.data?.data : undefined;

    return data({
      nearestAppointment,
      upcomingAppointments: upcomingPayload?.content ?? [],
      upcomingTotalElements: upcomingPayload?.totalElements ?? 0,
      upcomingPage: upcomingPayload?.page ?? safeUpcomingPage,
      upcomingSize: upcomingPayload?.size ?? APPOINTMENTS_PAGE_SIZE,
      upcomingTotalPages: upcomingPayload?.totalPages ?? 0,
      upcomingHasNext: upcomingPayload?.hasNext ?? false,
      upcomingHasPrevious: upcomingPayload?.hasPrevious ?? false,
      completedAppointments: completedPayload?.content ?? [],
      completedTotalElements: completedPayload?.totalElements ?? 0,
      completedPage: completedPayload?.page ?? safeCompletedPage,
      completedSize: completedPayload?.size ?? APPOINTMENTS_PAGE_SIZE,
      completedTotalPages: completedPayload?.totalPages ?? 0,
      completedHasNext: completedPayload?.hasNext ?? false,
      completedHasPrevious: completedPayload?.hasPrevious ?? false,
      error: null as string | null,
    });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente dine bookinger akkurat nå.');
    return data(
      {
        nearestAppointment: null as MyAppointmentDto | null,
        upcomingAppointments: [] as MyAppointmentDto[],
        upcomingTotalElements: 0,
        upcomingPage: 0,
        upcomingSize: APPOINTMENTS_PAGE_SIZE,
        upcomingTotalPages: 0,
        upcomingHasNext: false,
        upcomingHasPrevious: false,
        completedAppointments: [] as MyAppointmentDto[],
        completedTotalElements: 0,
        completedPage: 0,
        completedSize: APPOINTMENTS_PAGE_SIZE,
        completedTotalPages: 0,
        completedHasNext: false,
        completedHasPrevious: false,
        error: message,
      },
      { status: status ?? 400 },
    );
  }
}

export default function BookingPublicMyAppointmentsRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const nearestAppointment = loaderData.nearestAppointment ?? null;
  const upcomingAppointments = loaderData.upcomingAppointments ?? [];
  const completedAppointments = loaderData.completedAppointments ?? [];
  const isLoading = navigation.state !== 'idle';
  const upcomingPage = loaderData.upcomingPage ?? 0;
  const upcomingPageSize = loaderData.upcomingSize ?? 24;
  const upcomingTotalPages = loaderData.upcomingTotalPages ?? 0;
  const upcomingHasNext = loaderData.upcomingHasNext ?? false;
  const upcomingHasPrevious = loaderData.upcomingHasPrevious ?? false;
  const upcomingTotalElements = loaderData.upcomingTotalElements ?? 0;
  const completedPage = loaderData.completedPage ?? 0;
  const completedPageSize = loaderData.completedSize ?? 24;
  const completedTotalPages = loaderData.completedTotalPages ?? 0;
  const completedHasNext = loaderData.completedHasNext ?? false;
  const completedHasPrevious = loaderData.completedHasPrevious ?? false;
  const completedTotalElements = loaderData.completedTotalElements ?? 0;
  const buildSectionPageHref = (section: AppointmentPageSection, nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.delete('upcomingSize');
    params.delete('completedSize');
    if (section === 'upcoming') {
      params.set('upcomingPage', String(Math.max(0, nextPage)));
      if (!params.get('completedPage')) params.set('completedPage', String(completedPage));
    } else {
      params.set('completedPage', String(Math.max(0, nextPage)));
      if (!params.get('upcomingPage')) params.set('upcomingPage', String(upcomingPage));
    }
    return `?${params.toString()}`;
  };

  const buildNewBookingHref = (appointment?: MyAppointmentDto | null): string | null => {
    const companyId = appointment?.company.id;
    if (!companyId) return null;

    const params = new URLSearchParams({ companyId: String(companyId) });
    return `${getBookingRouteHref('session')}?${params.toString()}`;
  };

  const nearestUpcomingAppointment = nearestAppointment;
  const nearestUpcomingDate = nearestUpcomingAppointment ? formatDateParts(nearestUpcomingAppointment.startTime) : null;
  const nearestUpcomingDuration = nearestUpcomingAppointment
    ? formatDurationMinutes(nearestUpcomingAppointment.startTime, nearestUpcomingAppointment.endTime)
    : 0;
  const nearestCalendarPayload = buildCalendarPayload(nearestUpcomingAppointment ?? undefined);
  const nearestMapsUrl = buildGoogleMapsUrl(nearestUpcomingAppointment ?? undefined);
  const nearestCancelHref = buildCancelHref(nearestUpcomingAppointment ?? undefined);
  const nearestNewBookingHref = buildNewBookingHref(nearestUpcomingAppointment);
  const fallbackBookingHref =
    buildNewBookingHref(nearestUpcomingAppointment) ??
    buildNewBookingHref(upcomingAppointments[0]) ??
    buildNewBookingHref(completedAppointments[0]) ??
    ROUTES_MAP['booking.public.appointment'].href;
  const expiredAppointments = completedAppointments;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackBookingHref);
  };

  return (
    <BookingContainer>
      <Stack space="md">
        <div>
          <Button type="button" variant="booking-secondary" size="sm" className="gap-2" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Tilbake
          </Button>
        </div>
        <BookingPageHeader title="Mine bookinger" description="Her kan du se dine bookinger." />
        {loaderData.error && (
          <Notice variant="booking" tone="emphasis" title="Kunne ikke hente bookinger" message={loaderData.error} />
        )}

        {nearestUpcomingAppointment && (
          <BookingCard variant="emphasis" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary shadow-sm">
                  <CalendarClock className="size-6 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary md:text-sm">Neste time</p>
                  <p className="text-sm text-muted-foreground md:text-base">
                    {nearestUpcomingAppointment.company.name?.trim() ||
                      `Bedrift #${nearestUpcomingAppointment.company.id}`}
                  </p>
                </div>
              </div>

              {nearestUpcomingDate && (
                <div className="space-y-2 rounded-lg bg-background p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-primary md:size-6" />
                    <div>
                      <p className="text-xs font-medium capitalize text-muted-foreground md:text-sm">
                        {nearestUpcomingDate.dayName}
                      </p>
                      <p className="text-lg font-bold text-card-text md:text-xl">{nearestUpcomingDate.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-card-border pt-2">
                    <Clock className="size-5 text-primary md:size-6" />
                    <div className="flex flex-1 items-baseline justify-between gap-3">
                      <p className="text-lg font-bold text-card-text md:text-xl">kl. {nearestUpcomingDate.time}</p>
                      <p className="text-sm font-semibold text-muted-foreground">{nearestUpcomingDuration} min</p>
                    </div>
                  </div>
                </div>
              )}

              {getGroupedServices(nearestUpcomingAppointment).length > 0 && (
                <div className="space-y-2">
                  {getGroupedServices(nearestUpcomingAppointment).map((group) => (
                    <div key={group.id} className="space-y-2 border-b border-card-border pb-3 last:border-b-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.name}
                      </p>
                      <div className="space-y-1.5">
                        {group.services.map((service) => (
                          <div key={service.id} className="flex items-center gap-2">
                            <Sparkles className="size-4 text-primary" />
                            <span className="text-sm font-medium text-card-text md:text-base">{service.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(nearestNewBookingHref || nearestCalendarPayload || nearestMapsUrl || nearestCancelHref) && (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {nearestNewBookingHref && (
                    <Button asChild fullWidth>
                      <Link to={nearestNewBookingHref}>
                        <CalendarPlus className="size-5" />
                        Book ny time
                      </Link>
                    </Button>
                  )}
                  {nearestMapsUrl && (
                    <Button asChild variant="outline" fullWidth>
                      <a href={nearestMapsUrl} target="_blank" rel="noreferrer">
                        <MapPin className="size-5" />
                        Google Maps
                      </a>
                    </Button>
                  )}
                  {nearestCancelHref && (
                    <Button asChild variant="destructive" fullWidth>
                      <Link to={nearestCancelHref}>Avbestill</Link>
                    </Button>
                  )}
                  {nearestCalendarPayload ? (
                    <>
                      <Button asChild variant="outline" fullWidth>
                        <a href={nearestCalendarPayload.googleUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-5" />
                          Google Kalender
                        </a>
                      </Button>
                      <Button asChild variant="outline" fullWidth>
                        <a href={nearestCalendarPayload.href} download={nearestCalendarPayload.filename}>
                          <Calendar className="size-5" />
                          Last ned kalenderfil
                        </a>
                      </Button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </BookingCard>
        )}

        <BookingSection title={`Kommende bookinger (${upcomingTotalElements})`}>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen flere kommende bookinger.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => {
                const appointmentDate = formatDateParts(appointment.startTime);
                const appointmentDuration = formatDurationMinutes(appointment.startTime, appointment.endTime);
                const appointmentCalendarPayload = buildCalendarPayload(appointment);
                const appointmentMapsUrl = buildGoogleMapsUrl(appointment);
                const cancelHref = buildCancelHref(appointment);
                const newBookingHref = buildNewBookingHref(appointment);

                return (
                  <BookingCard key={appointment.id} className="overflow-hidden p-3 md:p-4">
                    <details className="group">
                      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-card-text md:text-base">
                              {appointment.company.name?.trim() || `Bedrift #${appointment.company.id}`}
                            </p>
                            <p className="text-xs text-muted-foreground md:text-sm">
                              {appointmentDate.date} kl. {appointmentDate.time}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge className={UPCOMING_BADGE_CLASS}>
                              <CircleDot className="mr-1 size-3.5" />
                              Kommende
                            </Badge>
                            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                          </div>
                        </div>
                      </summary>

                      <div className="mt-3 space-y-3 border-t border-card-border pt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                          <Clock className="size-4 text-primary" />
                          <span>Varighet: {appointmentDuration} min</span>
                        </div>

                        {getGroupedServices(appointment).length > 0 ? (
                          <div className="space-y-2">
                            {getGroupedServices(appointment).map((group) => (
                              <div
                                key={`${appointment.id}-${group.id}`}
                                className="space-y-1.5 border-b border-card-border pb-2.5 last:border-b-0"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {group.name}
                                </p>
                                {group.services.map((service) => (
                                  <div key={service.id} className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <span className="text-sm font-medium text-card-text">{service.name}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Ingen tjenester oppgitt</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {newBookingHref && (
                            <Button asChild size="sm">
                              <Link to={newBookingHref}>
                                <CalendarPlus className="size-4.5" />
                                Book ny time
                              </Link>
                            </Button>
                          )}
                          {appointmentCalendarPayload && (
                            <>
                              <Button asChild variant="outline" size="sm">
                                <a href={appointmentCalendarPayload.googleUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="size-4.5" />
                                  Google Kalender
                                </a>
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <a
                                  href={appointmentCalendarPayload.href}
                                  download={appointmentCalendarPayload.filename}
                                >
                                  <Calendar className="size-4.5" />
                                  Last ned kalenderfil
                                </a>
                              </Button>
                            </>
                          )}
                          {appointmentMapsUrl && (
                            <Button asChild variant="outline" size="sm">
                              <a href={appointmentMapsUrl} target="_blank" rel="noreferrer">
                                <MapPin className="size-4.5" />
                                Google Maps
                              </a>
                            </Button>
                          )}
                          {cancelHref && (
                            <Button asChild variant="destructive" size="sm">
                              <Link to={cancelHref}>Avbestill</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </details>
                  </BookingCard>
                );
              })}
            </div>
          )}
          <AppointmentPagination
            page={upcomingPage}
            pageSize={upcomingPageSize}
            totalElements={upcomingTotalElements}
            totalPages={upcomingTotalPages}
            hasPrevious={upcomingHasPrevious}
            hasNext={upcomingHasNext}
            itemCount={upcomingAppointments.length}
            previousHref={buildSectionPageHref('upcoming', upcomingPage - 1)}
            nextHref={buildSectionPageHref('upcoming', upcomingPage + 1)}
            isLoading={isLoading}
          />
        </BookingSection>

        <BookingSection title={`Tidligere bookinger (${completedTotalElements})`}>
          {expiredAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen tidligere bookinger å vise.</p>
          ) : (
            <div className="space-y-3">
              {expiredAppointments.map((appointment) => {
                const appointmentDate = formatDateParts(appointment.startTime);
                const appointmentDuration = formatDurationMinutes(appointment.startTime, appointment.endTime);
                const appointmentMapsUrl = buildGoogleMapsUrl(appointment);
                const newBookingHref = buildNewBookingHref(appointment);

                return (
                  <BookingCard key={appointment.id} className="overflow-hidden p-3 md:p-4">
                    <details className="group">
                      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-card-text md:text-base">
                              {appointment.company.name?.trim() || `Bedrift #${appointment.company.id}`}
                            </p>
                            <p className="text-xs text-muted-foreground md:text-sm">
                              {appointmentDate.date} kl. {appointmentDate.time}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge className={COMPLETED_BADGE_CLASS}>
                              <CheckCircle2 className="mr-1 size-3.5" />
                              Fullført
                            </Badge>
                            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                          </div>
                        </div>
                      </summary>

                      <div className="mt-3 space-y-3 border-t border-card-border pt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                          <Clock className="size-4 text-primary" />
                          <span>Varighet: {appointmentDuration} min</span>
                        </div>

                        {getGroupedServices(appointment).length > 0 ? (
                          <div className="space-y-2">
                            {getGroupedServices(appointment).map((group) => (
                              <div
                                key={`${appointment.id}-${group.id}`}
                                className="space-y-1.5 border-b border-card-border pb-2.5 last:border-b-0"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {group.name}
                                </p>
                                {group.services.map((service) => (
                                  <div key={service.id} className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <span className="text-sm font-medium text-card-text">{service.name}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Ingen tjenester oppgitt</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {newBookingHref && (
                            <Button asChild size="sm">
                              <Link to={newBookingHref}>
                                <CalendarPlus className="size-4.5" />
                                Book ny time
                              </Link>
                            </Button>
                          )}
                          {appointmentMapsUrl && (
                            <Button asChild variant="outline" size="sm">
                              <a href={appointmentMapsUrl} target="_blank" rel="noreferrer">
                                <MapPin className="size-4.5" />
                                Google Maps
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </details>
                  </BookingCard>
                );
              })}
            </div>
          )}
          <AppointmentPagination
            page={completedPage}
            pageSize={completedPageSize}
            totalElements={completedTotalElements}
            totalPages={completedTotalPages}
            hasPrevious={completedHasPrevious}
            hasNext={completedHasNext}
            itemCount={completedAppointments.length}
            previousHref={buildSectionPageHref('completed', completedPage - 1)}
            nextHref={buildSectionPageHref('completed', completedPage + 1)}
            isLoading={isLoading}
          />
        </BookingSection>
      </Stack>
    </BookingContainer>
  );
}
