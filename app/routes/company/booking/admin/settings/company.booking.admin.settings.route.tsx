import { NavLink } from 'react-router';
import { Settings2, SlidersHorizontal } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/route-tree';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CompanyPageTemplate, Text } from '~/ui';

export default function CompanyBookingAdminSettingsPage() {
  return (
    <CompanyPageTemplate
      title="Bookinginnstillinger"
      description="Samle generelle bookingvalg i samme kompakte sideoppsett som resten av booking-domenet."
      routeLinks={
        <>
          <NavLink
            to={ROUTES_MAP['company.booking'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
          >
            Oversikt
          </NavLink>
          <NavLink
            to={ROUTES_MAP['company.booking.admin'].href}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
          >
            Administrasjon
          </NavLink>
        </>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingsMetricCard
            label="Status"
            value="Klar"
            description="Siden er flyttet inn i templatesystemet og bruker bookingens designrytme."
            icon={<Settings2 className="h-5 w-5 text-primary" />}
          />
          <SettingsMetricCard
            label="Neste steg"
            value="Konfigurasjon"
            description="Legg kommende innstillingsfelt her uten å bryte designet mellom booking-sidene."
            icon={<SlidersHorizontal className="h-5 w-5 text-secondary" />}
            accent="success"
          />
        </div>
      }
    >
      <Card variant="default" className="bg-surface">
        <CardHeader>
          <CardTitle>Generelle innstillinger</CardTitle>
          <CardDescription>Denne siden er klar for videre konfigurasjon med samme komponentbibliotek.</CardDescription>
        </CardHeader>
        <CardContent>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Bruk kort, seksjoner og eventuelle fremtidige skjemaer fra `~/ui` slik at innstillingssiden følger samme kompakte struktur som bookingoversikt, bookingprofil og timebestillinger.
          </Text>
        </CardContent>
      </Card>
    </CompanyPageTemplate>
  );
}

function SettingsMetricCard({
  label,
  value,
  description,
  icon,
  accent = 'info',
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  accent?: 'info' | 'success';
}) {
  const accentClasses = {
    info: 'bg-primary/10',
    success: 'bg-secondary/10',
  } as const;

  return (
    <Card variant="default" size="sm" className="bg-surface">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {label}
            </Text>
            <Text as="p" variant="heading-lg">
              {value}
            </Text>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-md ${accentClasses[accent]}`}>{icon}</div>
        </div>
        <Text as="p" variant="body-sm" className="text-text-secondary">
          {description}
        </Text>
      </CardContent>
    </Card>
  );
}
