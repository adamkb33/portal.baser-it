import type { Route } from './+types/system-admin.route';
import { NavLink } from 'react-router';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Card, CardContent, CardHeader, CardTitle, CompanyPageTemplate, Text } from '~/ui';

const links = [
  { to: ROUTES_MAP['system-admin.users.invite'].href, title: 'Inviter bruker', desc: 'Opprett systemadmin-brukerinvitasjon.' },
  { to: ROUTES_MAP['system-admin.users.details'].href, title: 'Hent bruker', desc: 'Hent brukerdetaljer via userId.' },
  { to: ROUTES_MAP['system-admin.companies.create'].href, title: 'Opprett selskap', desc: 'Opprett nytt selskap fra org.nr.' },
  { to: ROUTES_MAP['system-admin.companies.roles'].href, title: 'Tildel roller', desc: 'Tildel ADMIN/EMPLOYEE til bruker i selskap.' },
  { to: ROUTES_MAP['system-admin.companies.products'].href, title: 'Tildel produkter', desc: 'Aktiver BOOKING/EVENT/TIMESHEET for selskap.' },
  { to: ROUTES_MAP['system-admin.diagnostics'].href, title: 'Diagnostikk', desc: 'Se systemadmin-diagnostikk per tjeneste/flyt.' },
  { to: ROUTES_MAP['system-admin.smtp.diagnostics'].href, title: 'SMTP diagnostikk', desc: 'Kjør backend SMTP diagnose-endepunkt.' },
];

export async function loader() {
  return null;
}

export default function SystemAdminPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadministrasjon" description="Systemadmin-operasjoner via generert SDK.">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {links.map((item) => (
          <NavLink key={item.to} to={item.to} className="rounded-md border border-border bg-surface p-4 hover:bg-surface-secondary">
            <Card variant="ghost" size="sm">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  {item.desc}
                </Text>
              </CardContent>
            </Card>
          </NavLink>
        ))}
      </div>
    </CompanyPageTemplate>
  );
}
