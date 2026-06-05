import { NavLink } from 'react-router';
import type { Route } from './+types/system-admin.smtp.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { CompanyPageTemplate, Panel } from '~/ui';

export async function loader() {
  return null;
}

export default function SystemAdminSmtpPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadmin: SMTP" description="SMTP-verifisering og diagnostikk.">
      <Panel title="Diagnostikk" description="Kjør diagnose mot backend SMTP-oppsett.">
        <NavLink className="inline-flex rounded-sm border border-border px-3 py-2 text-sm" to={ROUTES_MAP['system-admin.smtp.diagnostics'].href}>
          Åpne SMTP-diagnostikk
        </NavLink>
      </Panel>
    </CompanyPageTemplate>
  );
}
