import { data, Link, useLocation, useNavigation, useSearchParams } from 'react-router';
import type { Route } from './+types/booking.public.my-appointments.route';
import {
  Calendar,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
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
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { getBookingRouteHref } from '~/routes/_features/booking/_utils/booking.route-map';
import type { BookingSurface } from '~/routes/_features/booking/_utils/booking.surface';
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
const ACTION_LINK_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive';
const PRIMARY_ACTION_LINK_CLASS = `${ACTION_LINK_BASE} border-interactive bg-interactive text-text-inverse hover:bg-interactive-hover`;
const SECONDARY_ACTION_LINK_CLASS = `${ACTION_LINK_BASE} border-border bg-background text-text-primary hover:bg-surface`;
const DANGER_ACTION_LINK_CLASS = `${ACTION_LINK_BASE} border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20`;

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

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const upcomingPage = Number(url.searchParams.get('upcomingPage') || '0');
    const upcomingSize = Number(url.searchParams.get('upcomingSize') || '24');
    const completedPage = Number(url.searchParams.get('completedPage') || '0');
    const completedSize = Number(url.searchParams.get('completedSize') || '24');
    const safeUpcomingPage = Number.isNaN(upcomingPage) || upcomingPage < 0 ? 0 : upcomingPage;
    const safeUpcomingSize = Number.isNaN(upcomingSize) || upcomingSize <= 0 ? 24 : upcomingSize;
    const safeCompletedPage = Number.isNaN(completedPage) || completedPage < 0 ? 0 : completedPage;
    const safeCompletedSize = Number.isNaN(completedSize) || completedSize <= 0 ? 24 : completedSize;

    const [nearestResult, upcomingResult, completedResult] = await withAuth(request, async () => {
      return Promise.allSettled([
        AppointmentsController.getMyNearestAppointment(),
        AppointmentsController.getMyUpcomingAppointments({
          query: {
            page: safeUpcomingPage,
            size: safeUpcomingSize,
          },
        }),
        AppointmentsController.getMyCompletedAppointments({
          query: {
            page: safeCompletedPage,
            size: safeCompletedSize,
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
      upcomingSize: upcomingPayload?.size ?? safeUpcomingSize,
      upcomingTotalPages: upcomingPayload?.totalPages ?? 0,
      upcomingHasNext: upcomingPayload?.hasNext ?? false,
      upcomingHasPrevious: upcomingPayload?.hasPrevious ?? false,
      completedAppointments: completedPayload?.content ?? [],
      completedTotalElements: completedPayload?.totalElements ?? 0,
      completedPage: completedPayload?.page ?? safeCompletedPage,
      completedSize: completedPayload?.size ?? safeCompletedSize,
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
        upcomingSize: 24,
        upcomingTotalPages: 0,
        upcomingHasNext: false,
        upcomingHasPrevious: false,
        completedAppointments: [] as MyAppointmentDto[],
        completedTotalElements: 0,
        completedPage: 0,
        completedSize: 24,
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
  const location = useLocation();
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
  const bookingSurface: BookingSurface = location.pathname === '/embed' || location.pathname.startsWith('/embed/')
    ? 'embed'
    : 'public';

  const buildSectionPageHref = (section: 'upcoming' | 'completed', nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (section === 'upcoming') {
      params.set('upcomingPage', String(Math.max(0, nextPage)));
      params.set('upcomingSize', String(upcomingPageSize));
      if (!params.get('completedPage')) params.set('completedPage', String(completedPage));
      if (!params.get('completedSize')) params.set('completedSize', String(completedPageSize));
    } else {
      params.set('completedPage', String(Math.max(0, nextPage)));
      params.set('completedSize', String(completedPageSize));
      if (!params.get('upcomingPage')) params.set('upcomingPage', String(upcomingPage));
      if (!params.get('upcomingSize')) params.set('upcomingSize', String(upcomingPageSize));
    }
    return `?${params.toString()}`;
  };

  const buildNewBookingHref = (appointment?: MyAppointmentDto | null): string | null => {
    const companyId = appointment?.company.id;
    if (!companyId) return null;

    const params = new URLSearchParams({ companyId: String(companyId) });
    return `${getBookingRouteHref(bookingSurface, 'session')}?${params.toString()}`;
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
  const expiredAppointments = completedAppointments;

  return (
    <BookingContainer>
      <Stack space="md">
        <BookingPageHeader title="Mine bookinger" description="Her kan du se dine bookinger." />
        {loaderData.error && <Notice tone="emphasis" title="Kunne ikke hente bookinger" message={loaderData.error} />}

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
                  <div key={group.id} className="space-y-2 rounded-lg border border-card-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.name}</p>
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
                  <Link to={nearestNewBookingHref} className={`${PRIMARY_ACTION_LINK_CLASS} w-full px-4 py-3`}>
                    <CalendarPlus className="size-5" />
                    Book ny time
                  </Link>
                )}
                {nearestMapsUrl && (
                  <a href={nearestMapsUrl} target="_blank" rel="noreferrer" className={`${SECONDARY_ACTION_LINK_CLASS} w-full px-4 py-3`}>
                    <MapPin className="size-5" />
                    Google Maps
                  </a>
                )}
                {nearestCancelHref && (
                  <Link to={nearestCancelHref} className={`${DANGER_ACTION_LINK_CLASS} w-full px-4 py-3`}>
                    Avbestill
                  </Link>
                )}
                {nearestCalendarPayload ? (
                  <>
                <a
                  href={nearestCalendarPayload.googleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${SECONDARY_ACTION_LINK_CLASS} w-full px-4 py-3`}
                >
                  <ExternalLink className="size-5" />
                  Google Kalender
                </a>
                <a
                  href={nearestCalendarPayload.href}
                  download={nearestCalendarPayload.filename}
                  className={`${SECONDARY_ACTION_LINK_CLASS} w-full px-4 py-3`}
                >
                  <Calendar className="size-5" />
                  Last ned kalenderfil
                </a>
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
                              className="space-y-1.5 rounded-lg border border-card-border bg-background p-2.5"
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
                          <Link to={newBookingHref} className={PRIMARY_ACTION_LINK_CLASS}>
                            <CalendarPlus className="size-4.5" />
                            Book ny time
                          </Link>
                        )}
                        {appointmentCalendarPayload && (
                          <>
                            <a
                              href={appointmentCalendarPayload.googleUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={SECONDARY_ACTION_LINK_CLASS}
                            >
                              <ExternalLink className="size-4.5" />
                              Google Kalender
                            </a>
                            <a
                              href={appointmentCalendarPayload.href}
                              download={appointmentCalendarPayload.filename}
                              className={SECONDARY_ACTION_LINK_CLASS}
                            >
                              <Calendar className="size-4.5" />
                              Last ned kalenderfil
                            </a>
                          </>
                        )}
                        {appointmentMapsUrl && (
                          <a
                            href={appointmentMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={SECONDARY_ACTION_LINK_CLASS}
                          >
                            <MapPin className="size-4.5" />
                            Google Maps
                          </a>
                        )}
                        {cancelHref && (
                          <Link
                            to={cancelHref}
                            className={DANGER_ACTION_LINK_CLASS}
                          >
                            Avbestill
                          </Link>
                        )}
                      </div>
                    </div>
                  </details>
                </BookingCard>
              );
            })}
          </div>
        )}
        {upcomingTotalElements > 0 && (
          <div className="flex items-center justify-between gap-3 pt-1">
            <Link to={buildSectionPageHref('upcoming', upcomingPage - 1)}>
              <Button variant="outline" disabled={!upcomingHasPrevious || isLoading}>
                Forrige
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Side {upcomingPage + 1} av {Math.max(upcomingTotalPages, 1)}
            </p>
            <Link to={buildSectionPageHref('upcoming', upcomingPage + 1)}>
              <Button variant="outline" disabled={!upcomingHasNext || isLoading}>
                Neste
              </Button>
            </Link>
          </div>
        )}
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
                              className="space-y-1.5 rounded-lg border border-card-border bg-background p-2.5"
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
                          <Link to={newBookingHref} className={PRIMARY_ACTION_LINK_CLASS}>
                            <CalendarPlus className="size-4.5" />
                            Book ny time
                          </Link>
                        )}
                        {appointmentMapsUrl && (
                          <a
                            href={appointmentMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={SECONDARY_ACTION_LINK_CLASS}
                          >
                            <MapPin className="size-4.5" />
                            Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </details>
                </BookingCard>
              );
            })}
          </div>
        )}
        {completedTotalElements > 0 && (
          <div className="flex items-center justify-between gap-3 pt-1">
            <Link to={buildSectionPageHref('completed', completedPage - 1)}>
              <Button variant="outline" disabled={!completedHasPrevious || isLoading}>
                Forrige
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Side {completedPage + 1} av {Math.max(completedTotalPages, 1)}
            </p>
            <Link to={buildSectionPageHref('completed', completedPage + 1)}>
              <Button variant="outline" disabled={!completedHasNext || isLoading}>
                Neste
              </Button>
            </Link>
          </div>
        )}
        </BookingSection>
      </Stack>
    </BookingContainer>
  );
}
