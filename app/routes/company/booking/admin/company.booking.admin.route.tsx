import { Link, NavLink } from 'react-router';
import { FolderKanban, Briefcase } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CompanyPageTemplate,
  Text,
  routeLinkButtonClass,
} from '~/ui';

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
    href: ROUTES_MAP['company.booking.admin.service-groups.services'].href,
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
          <NavLink
            to={ROUTES_MAP['company.booking'].href}
            className={routeLinkButtonClass}
          >
            Oversikt
          </NavLink>
          <NavLink
            to={ROUTES_MAP['company.booking.appointments'].href}
            className={routeLinkButtonClass}
          >
            Timebestillinger
          </NavLink>
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
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Text as="p" variant="body-sm" className="text-text-secondary">
                    Gå til {item.title.toLowerCase()}
                  </Text>
                  <Text as="p" variant="label" className="text-text-primary">
                    Åpne
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
