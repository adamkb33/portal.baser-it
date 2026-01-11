import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData, useNavigation } from 'react-router';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Scissors,
  DollarSign,
  CheckCircle2,
  Edit3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';
import type { AppointmentSessionOverviewDto } from 'tmp/openapi/gen/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { BookingContainer, BookingPageHeader, BookingButton, BookingCard } from '../../_components/booking-layout';

type BookingPublicAppointmentSessionOverviewRouteLoaderData = {
  sessionOverview: AppointmentSessionOverviewDto;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    const response =
      await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.getAppointmentSessionOverview(
        {
          sessionId: session.sessionId,
        },
      );

    if (!response.data) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    return data<BookingPublicAppointmentSessionOverviewRouteLoaderData>({
      sessionOverview: response.data,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return redirect('/');
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.submitAppointmentSession(
      {
        sessionId: session.sessionId,
      },
    );

    return redirect(`${ROUTES_MAP['booking.public.appointment.success'].href}?companyId=${session.companyId}`);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

/* ========================================
   DATE FORMATTING
   ======================================== */

const DAYS_NO = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const MONTHS_NO = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
];

function formatNorwegianDateTime(dateTimeString: string): {
  dayName: string;
  date: string;
  time: string;
  full: string;
} {
  const dateObj = new Date(dateTimeString);
  const dayName = DAYS_NO[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = MONTHS_NO[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const time = dateTimeString.split('T')[1]?.substring(0, 5) || '';

  return {
    dayName,
    date: `${day}. ${month} ${year}`,
    time: `kl. ${time}`,
    full: `${dayName} ${day}. ${month} ${year} kl. ${time}`,
  };
}

/* ========================================
   COLLAPSIBLE SECTION COMPONENT
   ======================================== */

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  editLink?: string;
  badge?: React.ReactNode;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true, editLink, badge }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <BookingCard className="overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 transition-colors hover:bg-card-hover-bg"
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">{icon}</div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-bold text-card-text md:text-lg">{title}</h3>
          </div>
          {badge}
        </div>

        <div className="flex items-center gap-2">
          {editLink && (
            <Form method="get" action={editLink} onClick={(e) => e.stopPropagation()}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted md:text-sm"
              >
                <Edit3 className="size-3 md:size-3.5" />
                <span className="hidden sm:inline">Endre</span>
              </button>
            </Form>
          )}

          {isOpen ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && <div className="border-t border-card-border pt-3 md:pt-4">{children}</div>}
    </BookingCard>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function BookingPublicAppointmentSessionOverviewRoute() {
  const { sessionOverview } = useLoaderData<BookingPublicAppointmentSessionOverviewRouteLoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const totalDuration = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.duration, 0);
  const totalPrice = sessionOverview.selectedServices.reduce((sum, item) => sum + item.services.price, 0);

  const dateTime = formatNorwegianDateTime(sessionOverview.selectedStartTime);

  return (
    <>
      <BookingContainer>
        {/* ========================================
            PAGE HEADER
            ======================================== */}
        <BookingPageHeader title="Bekreft timebestilling" description="Gjennomgå detaljene før du bekrefter" />

        {/* ========================================
            APPOINTMENT HERO CARD
            ======================================== */}
        <div className=" overflow-hidden rounded-lg border-2 border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-sm md:p-6">
          {/* Decorative element */}
          <div className="absolute right-0 top-0 size-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative space-y-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary shadow-sm">
                <CheckCircle2 className="size-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary md:text-sm">
                  Klar for booking
                </p>
                <p className="text-sm text-muted-foreground md:text-base">
                  {sessionOverview.selectedServices.length}{' '}
                  {sessionOverview.selectedServices.length === 1 ? 'tjeneste' : 'tjenester'}
                </p>
              </div>
            </div>

            {/* Date & Time - Prominent */}
            <div className="space-y-2 rounded-lg bg-background/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary md:size-6" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">{dateTime.dayName}</p>
                  <p className="text-lg font-bold text-card-text md:text-xl">{dateTime.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-card-border pt-2">
                <Clock className="size-5 text-primary md:size-6" />
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <p className="text-lg font-bold text-card-text md:text-xl">{dateTime.time}</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-muted-foreground">{totalDuration} min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Price - Emphasized */}
            <div className="flex items-center justify-between gap-3 rounded-lg bg-primary p-4 text-primary-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="size-6 md:size-7" strokeWidth={2.5} />
                <span className="text-sm font-medium md:text-base">Total pris</span>
              </div>
              <p className="text-2xl font-bold md:text-3xl">{totalPrice} kr</p>
            </div>
          </div>
        </div>

        {/* ========================================
            COLLAPSIBLE DETAILS SECTIONS
            ======================================== */}

        {/* Contact Info */}
        <CollapsibleSection
          title="Kontaktinformasjon"
          icon={<User className="size-5 text-primary" />}
          editLink={ROUTES_MAP['booking.public.appointment.session.contact'].href}
          defaultOpen={false}
        >
          <dl className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Navn</dt>
                <dd className="text-sm font-semibold text-card-text md:text-base">
                  {sessionOverview.contact.givenName} {sessionOverview.contact.familyName}
                </dd>
              </div>
            </div>

            {sessionOverview.contact.email?.value && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">E-post</dt>
                  <dd className="text-sm font-medium text-card-text md:text-base">
                    {sessionOverview.contact.email.value}
                  </dd>
                </div>
              </div>
            )}

            {sessionOverview.contact.mobileNumber?.value && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Mobilnummer</dt>
                  <dd className="text-sm font-medium text-card-text md:text-base">
                    {sessionOverview.contact.mobileNumber.value}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </CollapsibleSection>

        {/* Stylist */}
        <CollapsibleSection
          title="Behandler"
          icon={<Scissors className="size-5 text-primary" />}
          editLink={ROUTES_MAP['booking.public.appointment.session.employee'].href}
          defaultOpen={false}
        >
          <div className="flex items-start gap-3">
            {sessionOverview.selectedProfile.image && (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-card-border md:size-20">
                <img
                  src={sessionOverview.selectedProfile.image.url}
                  alt={`${sessionOverview.selectedProfile.givenName} ${sessionOverview.selectedProfile.familyName}`}
                  className="size-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-base font-bold text-card-text md:text-lg">
                {sessionOverview.selectedProfile.givenName} {sessionOverview.selectedProfile.familyName}
              </h4>
              {sessionOverview.selectedProfile.description && (
                <p className="mt-1 text-sm text-muted-foreground md:text-base">
                  {sessionOverview.selectedProfile.description}
                </p>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Services */}
        <CollapsibleSection
          title="Tjenester"
          icon={<Sparkles className="size-5 text-primary" />}
          editLink={ROUTES_MAP['booking.public.appointment.session.select-services'].href}
          badge={
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              {sessionOverview.selectedServices.length}
            </span>
          }
        >
          <div className="space-y-2">
            {sessionOverview.selectedServices.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-card-accent/5 p-3"
              >
                <span className="text-sm font-medium text-card-text md:text-base">{item.services.name}</span>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground md:text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 md:size-3.5" />
                    {item.services.duration} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-card-text">
                    <DollarSign className="size-3 md:size-3.5" />
                    {item.services.price} kr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ========================================
            CONFIRMATION NOTE
            ======================================== */}
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 md:p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-card-text md:text-base">Ved å bekrefte godtar du våre vilkår</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Du vil motta en bekreftelse på e-post og SMS
            </p>
          </div>
        </div>
      </BookingContainer>

      {/* ========================================
          STICKY MOBILE CTA
          ======================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-card-border bg-background shadow-2xl md:hidden">
        <div className="p-4">
          {/* Quick summary */}
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-medium text-muted-foreground">
                  {dateTime.dayName} {dateTime.date}
                </p>
                <p className="text-sm font-bold text-card-text">{dateTime.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">{totalPrice} kr</p>
            </div>
          </div>

          {/* Confirm button */}
          <Form method="post">
            <BookingButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="size-5" strokeWidth={2.5} />
              Bekreft og book time
            </BookingButton>
          </Form>
        </div>
      </div>

      {/* ========================================
          DESKTOP CTA
          ======================================== */}
      <div className="sticky bottom-4 hidden rounded-lg border-2 border-primary bg-primary p-4 text-primary-foreground shadow-xl md:block">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary-foreground/20">
              <CheckCircle2 className="size-7" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">Klar for booking</p>
              <p className="text-lg font-bold">{dateTime.full}</p>
              <p className="text-sm font-medium opacity-90">Total: {totalPrice} kr</p>
            </div>
          </div>

          <Form method="post">
            <BookingButton
              type="submit"
              variant="secondary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-[200px]"
            >
              <CheckCircle2 className="size-5" strokeWidth={2.5} />
              Bekreft og book time
            </BookingButton>
          </Form>
        </div>
      </div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-36 md:hidden" aria-hidden="true" />
    </>
  );
}
