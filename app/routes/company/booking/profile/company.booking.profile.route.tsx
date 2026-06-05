// routes/company/booking/profile/route.tsx
import { NavLink } from 'react-router';
import { useMemo } from 'react';
import { User, Briefcase, CalendarDays, Image as ImageIcon } from 'lucide-react';

import type { Route } from './+types/company.booking.profile.route';
import { CompanyUserBookingProfileController, CompanyUserServiceGroupController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CompanyPageTemplate,
  Text,
  cn,
  routeLinkButtonClass,
} from '~/ui';

const DAY_ABBREV: Record<string, string> = {
  MONDAY: 'Mandag',
  TUESDAY: 'Tirsdag',
  WEDNESDAY: 'Onsdag',
  THURSDAY: 'Torsdag',
  FRIDAY: 'Fredag',
  SATURDAY: 'Lørdag',
  SUNDAY: 'Søndag',
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const [bookingProfileResponse, groupedServiceGroupsResponse] = await withAuth(request, async () => {
      return Promise.all([
        CompanyUserBookingProfileController.getBookingProfile(),
        CompanyUserServiceGroupController.getGroupedServiceGroups(),
      ]);
    });

    return {
      bookingProfile: bookingProfileResponse.data,
      groupedServiceGroups: groupedServiceGroupsResponse.data?.data ?? [],
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente bookingprofil');
    return {
      bookingProfile: undefined,
      groupedServiceGroups: [],
      error: message,
    };
  }
}

export default function BookingCompanyUserProfile({ loaderData }: Route.ComponentProps) {
  const { bookingProfile } = loaderData;

  const profileName =
    bookingProfile?.familyName && bookingProfile?.givenName
      ? `${bookingProfile.familyName} ${bookingProfile.givenName}`
      : 'Bookingprofil';

  const hasProfileImage = Boolean(bookingProfile?.image?.url);
  const hasDescription = Boolean(bookingProfile?.description?.trim());
  const hasServices = Boolean(bookingProfile?.services && bookingProfile.services.length > 0);
  const hasDailySchedule = Boolean(bookingProfile?.dailySchedule && bookingProfile.dailySchedule.length > 0);

  const totalServices = bookingProfile?.services?.reduce((acc, group) => acc + (group.services?.length ?? 0), 0) ?? 0;
  const totalServiceGroups = bookingProfile?.services?.length ?? 0;
  const scheduleSlots = bookingProfile?.dailySchedule?.length ?? 0;
  const availabilityDays = new Set(bookingProfile?.dailySchedule?.map((day) => day.dayOfWeek) ?? []).size;

  const sortedDailySchedule = useMemo(() => {
    if (!bookingProfile?.dailySchedule) return [];
    return [...bookingProfile.dailySchedule].sort((a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek]);
  }, [bookingProfile?.dailySchedule]);

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}`;
  };

  return (
    <CompanyPageTemplate
      title="Bookingprofil"
      description="Hold profilen, tjenestene og arbeidstidene dine konsistente med den kompakte booking-layouten."
      routeLinks={
        <>
          <NavLink
            to={ROUTES_MAP['company.booking'].href}
            className={routeLinkButtonClass}
          >
            Oversikt
          </NavLink>
          <NavLink
            to={ROUTES_MAP['company.booking.schedule-unavailability'].href}
            className={routeLinkButtonClass}
          >
            Mitt fravik
          </NavLink>
        </>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <ProfileMetricCard
            label="Tjenester"
            value={totalServices}
            icon={<Briefcase className="h-5 w-5 text-primary" />}
            accent="info"
          />
          <ProfileMetricCard
            label="Grupper"
            value={totalServiceGroups}
            icon={<Briefcase className="h-5 w-5 text-secondary" />}
            accent="success"
          />
          <ProfileMetricCard
            label="Dager"
            value={availabilityDays}
            icon={<CalendarDays className="h-5 w-5 text-primary" />}
            accent="info"
          />
          <ProfileMetricCard
            label="Tidsluker"
            value={scheduleSlots}
            icon={<CalendarDays className="h-5 w-5 text-secondary" />}
            accent="success"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          <Card variant="default" className="bg-surface">
            <CardHeader>
              <CardTitle>Profilforhåndsvisning</CardTitle>
              <CardDescription>Slik ser profilen ut for kunder.</CardDescription>
              <div className="flex justify-end">
                <NavLink
                  to={
                    bookingProfile
                      ? ROUTES_MAP['company.booking.profile.edit'].href
                      : ROUTES_MAP['company.booking.profile.create'].href
                  }
                  className="inline-flex h-10 items-center justify-center rounded-sm bg-interactive px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-interactive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
                >
                  {bookingProfile ? 'Rediger bookingprofil' : 'Legg til bookingprofil'}
                </NavLink>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                {hasProfileImage ? (
                  <img
                    src={bookingProfile?.image?.url ?? ''}
                    alt={profileName}
                    className="h-14 w-14 rounded-full object-cover border border-primary/30"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="text-xl font-semibold text-primary">{profileName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{profileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalServices} tjenester · {availabilityDays} tilgjengelige dager
                  </p>
                </div>
              </div>

              {hasDescription ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{bookingProfile?.description}</p>
              ) : (
                <div className="rounded-md bg-background p-3 text-xs text-muted-foreground">
                  Legg til en beskrivelse for å gjøre profilen mer personlig.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-background p-2.5">
                  <p className="text-xs text-muted-foreground">Tjenestegrupper</p>
                  <p className="text-base font-semibold text-foreground">{totalServiceGroups}</p>
                </div>
                <div className="rounded-md bg-background p-2.5">
                  <p className="text-xs text-muted-foreground">Tidsluker</p>
                  <p className="text-base font-semibold text-foreground">{scheduleSlots}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                {hasProfileImage ? 'Profilbilde er lagt til.' : 'Ingen profilbilde enda.'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card variant="default" className="bg-surface">
            <CardHeader>
              <CardTitle>Oversikt</CardTitle>
              <CardDescription>En rask oppsummering av profilen.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-md bg-background p-2.5">
                  <p className="text-xs text-muted-foreground">Tjenester</p>
                  <p className="text-lg font-semibold text-foreground">{totalServices}</p>
                </div>
                <div className="rounded-md bg-background p-2.5">
                  <p className="text-xs text-muted-foreground">Tjenestegrupper</p>
                  <p className="text-lg font-semibold text-foreground">{totalServiceGroups}</p>
                </div>
                <div className="rounded-md bg-background p-2.5">
                  <p className="text-xs text-muted-foreground">Dager tilgjengelig</p>
                  <p className="text-lg font-semibold text-foreground">{availabilityDays}</p>
                </div>
                <div className="rounded-md bg-background p-2.5">
                  <p className="text-xs text-muted-foreground">Tidsluker</p>
                  <p className="text-lg font-semibold text-foreground">{scheduleSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="multiple">
            <AccordionItem value="description">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-foreground">Om deg</h3>
                    <p className="text-sm text-muted-foreground">Gi kundene et inntrykk av profilen.</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {hasDescription ? (
                  <div className="rounded-md bg-surface p-3 text-sm text-foreground leading-relaxed">
                    {bookingProfile?.description}
                  </div>
                ) : (
                  <div className="rounded-md bg-surface p-3 text-sm text-muted-foreground">
                    Legg til en beskrivelse for å øke tillit og konvertering.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="services">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-foreground">Tjenester</h3>
                    <p className="text-sm text-muted-foreground">
                      {totalServices} tjenester fordelt på {totalServiceGroups} grupper.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {hasServices ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {bookingProfile?.services?.map((group) => (
                      <div key={group.id} className="rounded-md bg-surface p-3">
                        <p className="text-sm font-semibold text-foreground">{group.name}</p>
                        <div className="mt-2 space-y-2">
                          {group.services.map((service) => (
                            <div key={service.id} className="flex items-center justify-between text-xs">
                              <span className="text-foreground">{service.name}</span>
                              <span className="text-muted-foreground">
                                {service.duration} min · <span className="font-semibold">kr {service.price}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-surface p-3 text-sm text-muted-foreground">
                    Legg til tjenester slik at kundene vet hva de kan bestille.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="schedule">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-chart-3" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-foreground">Arbeidstider</h3>
                    <p className="text-sm text-muted-foreground">Vis når du er tilgjengelig.</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {hasDailySchedule ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sortedDailySchedule.map((day) => (
                      <div key={day.id} className="flex items-center justify-between rounded-md bg-surface px-3 py-2.5">
                        <span className="text-sm font-medium text-foreground">{DAY_ABBREV[day.dayOfWeek]}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeRange(day.startTime, day.endTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-surface p-3 text-sm text-muted-foreground">
                    Sett opp arbeidstider for å la kunder booke tider.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </CompanyPageTemplate>
  );
}

function ProfileMetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: 'info' | 'success';
}) {
  const accentClasses = {
    info: 'bg-primary/10',
    success: 'bg-secondary/10',
  } as const;

  return (
    <Card variant="default" size="sm" className="bg-surface">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {label}
            </Text>
            <Text as="p" variant="heading-md">
              {value}
            </Text>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', accentClasses[accent])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
