import { Link } from 'react-router';
import { ClipboardCheck, ShieldCheck } from 'lucide-react';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, Panel, Text } from '~/ui';

export default function CompanyTimesheetAdminRoute() {
  return (
    <CompanyPageTemplate
      title="Timelisteadministrasjon"
      description="Administrer innsendte timelister og gå videre til godkjenning i samme kompakte company-mønster."
      label="Admin"
      actions={
        <Button asChild size="sm">
          <Link to={ROUTES_MAP['company.timesheet.admin.submissions'].href}>Åpne innsendinger</Link>
        </Button>
      }
    >
      <Panel title="Innsendinger" description="Godkjenn eller avvis innsendte timer per ansatt.">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-text-secondary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <Text as="p" variant="label">
              Neste steg
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              Bruk innsendinger for å se registreringer fordelt per ansatt og oppdatere status samlet.
            </Text>
          </div>
        </div>
      </Panel>

      <Panel title="Tilgang" description="Denne siden er reservert for administrative timelistehandlinger.">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-text-secondary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Alt innhold under administrasjon følger samme kompanjonmønster som booking og admin, uten egne
            designvarianter.
          </Text>
        </div>
      </Panel>
    </CompanyPageTemplate>
  );
}
