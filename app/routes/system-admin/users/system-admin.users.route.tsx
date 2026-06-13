import { NavLink } from 'react-router';
import type { Route } from './+types/system-admin.users.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, Panel, Text } from '~/ui';

export async function loader() {
  return null;
}

export default function SystemAdminUsersPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadmin: Brukere" description="Administrer systemadmin-brukere via SDK-endepunkter.">
      <Panel title="Handlinger" description="Velg ønsket handling.">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <NavLink to={ROUTES_MAP['system-admin.users.invite'].href}>Inviter bruker</NavLink>
          </Button>
          <Button asChild variant="outline">
            <NavLink to={ROUTES_MAP['system-admin.users.details'].href}>Hent bruker</NavLink>
          </Button>
        </div>
        <Text as="p" variant="body-sm" className="mt-2 text-text-secondary">
          Alle handlinger følger samme flash-melding og feilvisning som resten av prosjektet.
        </Text>
      </Panel>
    </CompanyPageTemplate>
  );
}
