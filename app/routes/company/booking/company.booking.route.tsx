import type { Route } from './+types/company.booking.route';
import { CompanyUserBookingController } from '~/api/generated/booking';
import { NavLink } from 'react-router';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Award,
  Clock,
  Activity,
  Package,
  UserCheck,
  MousePointer,
  BarChart3,
  Target,
  Image,
  AlertCircle,
  CalendarClock,
  User,
  Briefcase,
} from 'lucide-react';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Card, CardContent, CompanyEmptyState, CompanyPageTemplate, Text, cn } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const [metricsResponse] = await withAuth(request, async () => {
      return Promise.all([await CompanyUserBookingController.getCompanyBookingMetrics()]);
    });

    if (!metricsResponse.data) {
      throw Error('Det skjedde en feil, kontakt support');
    }

    return {
      metrics: metricsResponse.data.data,
    };
  } catch (error: any) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente nøkkeltall');
    return { error: message };
  }
}

export default function CompanyBookingPage({ loaderData }: Route.ComponentProps) {
  const { metrics, error } = loaderData;

  if (!metrics) {
    return (
      <CompanyPageTemplate
        title="Booking"
        description="Nøkkeltall, aktivitetsoversikt og profilinnsikt for booking-domenet."
      >
        <CompanyEmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="Kunne ikke hente bookingoversikten"
          description={error ?? 'Det oppstod en feil ved lasting av bookingnøkkeltall.'}
        />
      </CompanyPageTemplate>
    );
  }

  const { summary, profiles } = metrics;

  return (
    <CompanyPageTemplate
      title="Booking"
      description="Nøkkeltall, aktivitetsoversikt og profilinnsikt for booking-domenet. Samme kompakte sideoppsett skal kunne gjenbrukes på tvers av company-ruter."
      routeLinks={
        <NavLink
          to={ROUTES_MAP['company.booking.appointments'].href}
          className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
        >
          Timebestillinger
        </NavLink>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryMetricCard
            label="Omsetning Denne Måneden"
            value={formatCurrency(summary.revenue.revenueThisMonth)}
            icon={<DollarSign className="h-6 w-6 text-primary" />}
            accent="info"
            meta={
              <div
                className={cn(
                  'mt-1 flex items-center gap-1 text-sm',
                  summary.revenue.monthOverMonthChangePercent >= 0 ? 'text-secondary' : 'text-destructive',
                )}
              >
                {summary.revenue.monthOverMonthChangePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(summary.revenue.monthOverMonthChangePercent).toFixed(2)}% fra forrige måned
              </div>
            }
          />

          <SummaryMetricCard
            label="Timer Denne Måneden"
            value={`${profiles.reduce((sum, p) => sum + p.totalHoursThisMonth, 0).toFixed(1)}t`}
            icon={<Clock className="h-6 w-6 text-secondary" />}
            accent="success"
            meta={
              <Text as="p" variant="body-sm" className="text-text-secondary">
                {summary.bookings.appointmentsThisMonth} avtaler
              </Text>
            }
          />

          <SummaryMetricCard
            label="Unike Kunder"
            value={summary.customers.uniqueCustomersThisMonth}
            icon={<Users className="h-6 w-6 text-text-primary" />}
            accent="neutral"
            meta={
              <Text as="p" variant="body-sm" className="text-text-secondary">
                {summary.customers.returningCustomers} gjengangere
              </Text>
            }
          />
        </div>
      }
    >
      <Accordion type="multiple" defaultValue={[]}>
        {/* Revenue & Financial Section */}
        <AccordionItem value="revenue">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <DollarSign className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary">Omsetning & Økonomi</h3>
                  <p className="text-sm text-text-secondary">Inntekter, trender og prognoser</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Revenue Overview */}
                <SectionBlock
                  title="Omsetningsoversikt"
                  icon={<BarChart3 className="h-4 w-4 text-primary" />}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox
                      label="I Dag"
                      value={formatCurrency(summary.revenue.revenueToday)}
                      icon={<Calendar className="h-4 w-4" />}
                      variant="info"
                    />
                    <MetricBox
                      label="Denne Måneden"
                      value={formatCurrency(summary.revenue.revenueThisMonth)}
                      icon={<TrendingUp className="h-4 w-4" />}
                      variant="success"
                    />
                    <MetricBox
                      label="Forrige Måned"
                      value={formatCurrency(summary.revenue.revenueLastMonth)}
                      icon={<Clock className="h-4 w-4" />}
                      variant="neutral"
                    />
                    <MetricBox
                      label="Prognose"
                      value={formatCurrency(summary.revenue.projectedRevenue)}
                      icon={<Target className="h-4 w-4" />}
                      variant="info"
                    />
                  </div>
                </SectionBlock>

                {/* Revenue by Service Group */}
                <SectionBlock
                  title="Omsetning per Tjenestegruppe"
                  icon={<Package className="h-4 w-4 text-secondary" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.revenue.revenueByServiceGroup.map((group) => (
                      <div key={group.groupId} className="flex items-center justify-between rounded-lg bg-background p-4">
                        <div>
                          <p className="font-medium text-text-primary">{group.groupName}</p>
                          <p className="text-xs text-text-secondary">{group.appointmentCount} avtaler</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-text-primary">{formatCurrency(group.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionBlock>

                {/* Average Appointment Value */}
                <div className="rounded-md border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
                        <Award className="h-5 w-5 text-text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Gjennomsnittlig Avtaleverdi</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {formatCurrency(summary.revenue.averageAppointmentValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
        </AccordionItem>

        {/* Booking Activity Section */}
        <AccordionItem value="bookings">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Calendar className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary">Bestillingsaktivitet</h3>
                  <p className="text-sm text-text-secondary">Avtaler, trender og topptider</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Booking Stats */}
                <SectionBlock
                  title="Avtalestatistikk"
                  icon={<Activity className="h-4 w-4 text-secondary" />}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox
                      label="I Dag"
                      value={summary.bookings.appointmentsToday}
                      icon={<Calendar className="h-4 w-4" />}
                      variant="info"
                    />
                    <MetricBox
                      label="Kommende 7 Dager"
                      value={summary.bookings.upcomingSevenDays}
                      icon={<CalendarClock className="h-4 w-4" />}
                      variant="warning"
                    />
                    <MetricBox
                      label="Denne Måneden"
                      value={summary.bookings.appointmentsThisMonth}
                      icon={<TrendingUp className="h-4 w-4" />}
                      variant="success"
                    />
                    <MetricBox
                      label="Endring M/M"
                      value={`${summary.bookings.monthOverMonthChangePercent >= 0 ? '+' : ''}${summary.bookings.monthOverMonthChangePercent.toFixed(2)}%`}
                      icon={
                        summary.bookings.monthOverMonthChangePercent >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )
                      }
                      variant={summary.bookings.monthOverMonthChangePercent >= 0 ? 'success' : 'error'}
                    />
                  </div>
                </SectionBlock>

                {/* Peak Booking Times */}
                <SectionBlock
                  title="Topptider for Bestillinger"
                  icon={<Clock className="h-4 w-4 text-chart-3" />}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {summary.bookings.peakBookingTimes.slice(0, 6).map((peak, idx) => (
                      <div key={idx} className="rounded-lg bg-background p-3">
                        <p className="text-sm font-medium text-text-primary">{peak.dayOfWeek}</p>
                        <p className="text-xs text-text-secondary">Kl. {peak.hour}:00</p>
                        <p className="mt-1 text-lg font-bold text-text-primary">{peak.bookingCount} avtaler</p>
                      </div>
                    ))}
                  </div>
                </SectionBlock>

                {/* 30-Day Trend */}
                <SectionBlock
                  title="30-Dagers Trend"
                  icon={<BarChart3 className="h-4 w-4 text-primary" />}
                >
                  <div className="h-24 flex items-end gap-1">
                    {summary.bookings.trendLast30Days.map((day, idx) => {
                      const maxCount = Math.max(...summary.bookings.trendLast30Days.map((d) => d.count));
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={idx}
                          className="flex-1 rounded-t bg-border transition-colors hover:bg-surface"
                          style={{ height: `${height}%` }}
                          title={`${day.date}: ${day.count} avtaler`}
                        />
                      );
                    })}
                  </div>
                </SectionBlock>
              </div>
            </AccordionContent>
        </AccordionItem>

        {/* Service Performance Section */}
        <AccordionItem value="services">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Package className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary">Tjenesteytelse</h3>
                  <p className="text-sm text-text-secondary">Populære tjenester og optimaliseringsmuligheter</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Service Overview */}
                <SectionBlock title="Tjenesteoversikt" icon={<Package className="h-4 w-4 text-chart-5" />}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox
                    label="Aktive Tjenester"
                    value={summary.services.totalActiveServices}
                    icon={<Package className="h-4 w-4" />}
                    variant="success"
                  />
                  <MetricBox
                    label="Tjenestegrupper"
                    value={summary.services.totalServiceGroups}
                    icon={<Briefcase className="h-4 w-4" />}
                    variant="info"
                  />
                  <MetricBox
                    label="Uten Bilder"
                    value={summary.services.servicesWithoutImages}
                    icon={<Image className="h-4 w-4" />}
                    variant={summary.services.servicesWithoutImages > 0 ? 'warning' : 'success'}
                  />
                  <MetricBox
                    label="Aldri Bestilt"
                    value={summary.services.neverBookedServices.length}
                    icon={<AlertCircle className="h-4 w-4" />}
                    variant={summary.services.neverBookedServices.length > 0 ? 'warning' : 'success'}
                  />
                </div>
                </SectionBlock>

                {/* Most Popular Services */}
                <SectionBlock
                  title="Mest Populære Tjenester"
                  icon={<Award className="h-4 w-4 text-secondary" />}
                >
                  <div className="space-y-2">
                    {summary.services.mostPopularServices.map((service, idx) => (
                      <div
                        key={service.serviceId}
                        className="flex items-center justify-between rounded-lg bg-background p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-surface">
                            <span className="text-sm font-bold text-text-primary">#{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{service.serviceName}</p>
                            <p className="text-xs text-text-secondary">{service.groupName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-text-primary">{formatCurrency(service.totalRevenue)}</p>
                          <p className="text-xs text-text-secondary">{service.bookingCount} bestillinger</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionBlock>

                {/* Never Booked Services */}
                {summary.services.neverBookedServices.length > 0 && (
                  <SectionBlock
                    title="Tjenester Uten Bestillinger"
                    icon={<AlertCircle className="h-4 w-4 text-destructive" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {summary.services.neverBookedServices.map((service) => (
                        <div
                          key={service.serviceId}
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">{service.serviceName}</p>
                            <p className="text-xs text-text-secondary">{service.groupName}</p>
                          </div>
                          <p className="text-sm font-semibold text-text-secondary">{formatCurrency(service.price)}</p>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>
                )}
              </div>
            </AccordionContent>
        </AccordionItem>

        {/* Customer Insights Section */}
        <AccordionItem value="customers">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Users className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary">Kundeinnsikt</h3>
                  <p className="text-sm text-text-secondary">Kundeanalyse og engasjement</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <SectionBlock title="Kundeoversikt" icon={<Users className="h-4 w-4" />}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBox
                    label="Totalt Unike"
                    value={summary.customers.totalUniqueCustomers}
                    icon={<Users className="h-4 w-4" />}
                    variant="info"
                  />
                  <MetricBox
                    label="Nye Denne Måneden"
                    value={summary.customers.uniqueCustomersThisMonth}
                    icon={<UserCheck className="h-4 w-4" />}
                    variant="success"
                  />
                  <MetricBox
                    label="Gjengangere"
                    value={summary.customers.returningCustomers}
                    icon={<Award className="h-4 w-4" />}
                    variant="success"
                  />
                  <MetricBox
                    label="Gj.snitt Avtaler"
                    value={summary.customers.averageAppointmentsPerCustomer.toFixed(1)}
                    icon={<BarChart3 className="h-4 w-4" />}
                    variant="neutral"
                  />
                </div>
                </SectionBlock>

                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
                        <CalendarClock className="h-5 w-5 text-text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Kunder med Kommende Avtaler</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {summary.customers.customersWithUpcomingAppointments}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
        </AccordionItem>

        {/* Session Analytics Section */}
        <AccordionItem value="sessions">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <MousePointer className="h-5 w-5 text-text-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary">Øktanalyse</h3>
                  <p className="text-sm text-text-secondary">Brukerøkter og konverteringsrater</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <SectionBlock title="Øktoversikt" icon={<Activity className="h-4 w-4 text-primary" />}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricBox
                  label="Aktive Økter"
                  value={summary.sessions.activeSessions}
                  icon={<Activity className="h-4 w-4" />}
                  variant="info"
                />
                <MetricBox
                  label="Fullførte (30d)"
                  value={summary.sessions.completedSessionsLast30Days}
                  icon={<Award className="h-4 w-4" />}
                  variant="success"
                />
                <MetricBox
                  label="Forlatte (30d)"
                  value={summary.sessions.abandonedSessionsLast30Days}
                  icon={<AlertCircle className="h-4 w-4" />}
                  variant="warning"
                />
                <MetricBox
                  label="Konvertering"
                  value={`${summary.sessions.sessionToBookingConversionRate}%`}
                  icon={<Target className="h-4 w-4" />}
                  variant="success"
                />
              </div>
              </SectionBlock>

              <div className="mt-6 rounded-lg bg-background p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-text-secondary" />
                  <div>
                    <p className="text-sm text-text-secondary">Gjennomsnittlig Økttid</p>
                    <p className="text-xl font-bold text-text-primary">
                      {(summary.sessions.averageSessionDurationMinutes / 60).toFixed(2)} timer
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
        </AccordionItem>

        {/* Profile Breakdown Section */}
        <AccordionItem value="profiles">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-chart-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Profilanalyse</h3>
                  <p className="text-sm text-muted-foreground">Ytelse per ansatt</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <Card key={profile.profileId} variant="ghost">
                    <CardContent className="pt-6">
                      {/* Profile Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {profile.profileImageUrl ? (
                            <img
                              src={profile.profileImageUrl}
                              alt={profile.profileName}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-foreground">{profile.profileName}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {profile.totalHoursThisMonth}t denne måneden
                            </span>
                            {!profile.hasSchedule && (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Ingen timeplan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profile Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Omsetning</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(profile.revenueThisMonth)}
                          </p>
                          <p
                            className={`text-xs mt-1 ${profile.revenueThisMonth - profile.revenueLastMonth >= 0 ? 'text-secondary' : 'text-destructive'}`}
                          >
                            {profile.revenueThisMonth > profile.revenueLastMonth ? '+' : ''}
                            {formatCurrency(profile.revenueThisMonth - profile.revenueLastMonth)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Avtaler</p>
                          <p className="text-lg font-bold text-foreground">{profile.appointmentsThisMonth}</p>
                          <p className="text-xs text-muted-foreground mt-1">Kommende: {profile.upcomingSevenDays}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Gj.snitt Verdi</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(profile.averageAppointmentValue)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Kunder</p>
                          <p className="text-lg font-bold text-foreground">{profile.uniqueCustomersThisMonth}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {profile.returningCustomerCount} gjengangere
                          </p>
                        </div>
                      </div>

                      {/* Projected Revenue */}
                      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Anslått Månedsomsetning</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(profile.projectedRevenue)}
                          </span>
                        </div>
                      </div>

                      {/* Upcoming Unavailability */}
                      {profile.upcomingUnavailability.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-foreground mb-2">Kommende Fravær</p>
                          <div className="space-y-1">
                            {profile.upcomingUnavailability.map((unavail, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="h-3 w-3" />
                                <span>
                                  {formatDateTime(unavail.startTime)} - {formatDateTime(unavail.endTime)}
                                </span>
                                {unavail.reason && <span className="text-foreground">({unavail.reason})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CompanyPageTemplate>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

type MetricBoxProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: 'success' | 'error' | 'warning' | 'info' | 'neutral';
};

type SectionBlockProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function SectionBlock({ title, icon, children }: SectionBlockProps) {
  return (
    <section className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-sm bg-surface px-3 py-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-background">{icon}</span>
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      </div>
      {children}
    </section>
  );
}

type SummaryMetricCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  meta?: React.ReactNode;
  accent: 'info' | 'success' | 'neutral';
};

function SummaryMetricCard({ label, value, icon, meta, accent }: SummaryMetricCardProps) {
  const accentClasses = {
    info: 'bg-background',
    success: 'bg-background',
    neutral: 'bg-background',
  } as const;

  return (
    <Card variant="default" size="sm" className="bg-surface">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {label}
            </Text>
            <Text as="p" variant="heading-lg" className="text-text-primary">
              {value}
            </Text>
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-md', accentClasses[accent])}>{icon}</div>
        </div>
        {meta}
      </CardContent>
    </Card>
  );
}

function MetricBox({ label, value, icon, variant }: MetricBoxProps) {
  const variantStyles = {
    success: {
      panel: 'bg-surface',
      icon: 'bg-background text-text-secondary',
    },
    error: {
      panel: 'bg-surface',
      icon: 'bg-background text-destructive',
    },
    warning: {
      panel: 'bg-surface',
      icon: 'bg-background text-text-secondary',
    },
    info: {
      panel: 'bg-surface',
      icon: 'bg-background text-text-secondary',
    },
    neutral: {
      panel: 'bg-surface',
      icon: 'bg-background text-text-secondary',
    },
  };

  return (
    <div className={cn('space-y-2 rounded-md p-4', variantStyles[variant].panel)}>
      <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-sm', variantStyles[variant].icon)}>{icon}</div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
