import { Link, NavLink } from 'react-router';
import { FolderKanban, Briefcase } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Card, CardAction, CardContent, CardHead, Button, CompanyPageTemplate, Icon, KpiCard, Text } from '~/ui';

const adminNavigation = [
  {
    id: 'service-groups',
    title: 'Tjenestegrupper',
    description: 'Organiser tjenester i grupper for enklere administrasjon.',
    href: ROUTES_MAP['company.booking.admin.service-groups'].href,
    icon: FolderKanban,
  },
  {
    id: 'services',
    title: 'Tjenester',
    description: 'Opprett og vedlikehold tjenester, varighet og priser.',
    href: ROUTES_MAP['company.booking.admin.services'].href,
    icon: Briefcase,
  },
];

export default function CompanyBookingAdminPage() {
  return (
    <CompanyPageTemplate
      title="Booking Administrasjon"
      description="Administrer bookingkatalogen med samme kompakte overflate og farger som resten av booking-domenet."
      routeLinks={
        <>
          <Button asChild variant="outline" size="sm">
            <NavLink to={ROUTES_MAP['company.booking'].href}>Oversikt</NavLink>
          </Button>
          <Button asChild variant="outline" size="sm">
            <NavLink to={ROUTES_MAP['company.booking.appointments'].href}>Timebestillinger</NavLink>
          </Button>
        </>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminMetricCard
            label="Navigasjonspunkter"
            value={adminNavigation.length}
            description="Kompakt administrasjon for tjenester og grupper."
            icon={<FolderKanban className="h-6 w-6 text-primary" />}
          />
          <AdminMetricCard
            label="Neste steg"
            value="Katalog"
            description="Bruk kortene under for å vedlikeholde katalog og priser."
            icon={<Briefcase className="h-6 w-6 text-secondary" />}
            accent="success"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.href} className="group">
              <Card variant="interactive" size="md" className="h-full bg-surface">
                <CardHead
                  heading={item.title}
                  action={
                    <CardAction>
                      Åpne
                      <Icon name="arrow-right" />
                    </CardAction>
                  }
                >
                  <div className="mt-2 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-background">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      {item.description}
                    </Text>
                  </div>
                </CardHead>
                <CardContent className="space-y-3">
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Gå til {item.title.toLowerCase()}
                  </Text>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </CompanyPageTemplate>
  );
}

function AdminMetricCard({
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
  return <KpiCard label={label} value={value} icon={icon} compare={description} tone={accent} />;
}
