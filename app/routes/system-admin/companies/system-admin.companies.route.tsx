import { NavLink } from 'react-router';
import type { Route } from './+types/system-admin.companies.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { CompanyPageTemplate, Panel } from '~/ui';

export async function loader() {
  return null;
}

export default function SystemAdminCompaniesPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadmin: Selskaper" description="Systemadmin-operasjoner for selskaper.">
      <Panel title="Handlinger" description="Velg ønsket handling.">
        <div className="flex flex-wrap gap-2">
          <NavLink className="rounded-sm border border-border px-3 py-2 text-sm" to={ROUTES_MAP['system-admin.companies.create'].href}>
            Opprett selskap
          </NavLink>
          <NavLink className="rounded-sm border border-border px-3 py-2 text-sm" to={ROUTES_MAP['system-admin.companies.roles'].href}>
            Tildel roller
          </NavLink>
          <NavLink className="rounded-sm border border-border px-3 py-2 text-sm" to={ROUTES_MAP['system-admin.companies.products'].href}>
            Tildel produkter
          </NavLink>
        </div>
      </Panel>
    </CompanyPageTemplate>
  );
}
