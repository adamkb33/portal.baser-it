import type { Route } from './+types/system-admin.route';
import { NavLink } from 'react-router';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Card, CardAction, CardContent, CardGrid, CardHead, CompanyPageTemplate, GridCol, Icon, Text } from '~/ui';

const links = [
  {
    to: ROUTES_MAP['system-admin.users.invite'].href,
    eyebrow: 'Brukere',
    title: 'Inviter bruker',
    desc: 'Opprett systemadmin-brukerinvitasjon.',
  },
  {
    to: ROUTES_MAP['system-admin.users.details'].href,
    eyebrow: 'Brukere',
    title: 'Hent bruker',
    desc: 'Hent brukerdetaljer via userId.',
  },
  {
    to: ROUTES_MAP['system-admin.companies.create'].href,
    eyebrow: 'Selskaper',
    title: 'Opprett selskap',
    desc: 'Opprett nytt selskap fra org.nr.',
  },
  {
    to: ROUTES_MAP['system-admin.companies.roles'].href,
    eyebrow: 'Selskaper',
    title: 'Tildel roller',
    desc: 'Tildel ADMIN/EMPLOYEE til bruker i selskap.',
  },
  {
    to: ROUTES_MAP['system-admin.companies.products'].href,
    eyebrow: 'Selskaper',
    title: 'Tildel produkter',
    desc: 'Aktiver BOOKING/EVENT/TIMESHEET for selskap.',
  },
  {
    to: ROUTES_MAP['system-admin.companies.products.delete'].href,
    eyebrow: 'Selskaper',
    title: 'Fjern produkter',
    desc: 'Deaktiver produkter for selskap.',
  },
  {
    to: ROUTES_MAP['system-admin.diagnostics'].href,
    eyebrow: 'Diagnostikk',
    title: 'Diagnostikk',
    desc: 'Se systemadmin-diagnostikk per tjeneste/flyt.',
  },
  {
    to: ROUTES_MAP['system-admin.smtp.diagnostics'].href,
    eyebrow: 'Diagnostikk',
    title: 'SMTP diagnostikk',
    desc: 'Kjør backend SMTP diagnose-endepunkt.',
  },
];

export async function loader() {
  return null;
}

export default function SystemAdminPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadministrasjon" description="Systemadmin-operasjoner via generert SDK.">
      <CardGrid>
        {links.map((item) => (
          <GridCol key={item.to} span={6}>
            <Card as="section" className="h-full">
              <CardHead
                eyebrow={item.eyebrow}
                heading={item.title}
                action={
                  <CardAction asChild>
                    <NavLink to={item.to}>
                      Åpne
                      <Icon name="arrow-right" />
                    </NavLink>
                  </CardAction>
                }
              />
              <CardContent>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  {item.desc}
                </Text>
              </CardContent>
            </Card>
          </GridCol>
        ))}
      </CardGrid>
    </CompanyPageTemplate>
  );
}
