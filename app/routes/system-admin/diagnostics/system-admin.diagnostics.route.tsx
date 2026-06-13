import { NavLink } from 'react-router';
import type { Route } from './+types/system-admin.diagnostics.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Card, CardAction, CardContent, CardGrid, CardHead, CompanyPageTemplate, GridCol, Icon, Text } from '~/ui';

export async function loader() {
  return null;
}

export default function SystemAdminDiagnosticsPage(_props: Route.ComponentProps) {
  return (
    <CompanyPageTemplate title="Systemadmin: Diagnostikk" description="Diagnostikk per tjeneste og flyt.">
      <CardGrid>
        <GridCol span={6}>
          <Card as="section" className="h-full">
            <CardHead
              eyebrow="Flyt"
              heading="Booking"
              action={
                <CardAction asChild>
                  <NavLink to={ROUTES_MAP['system-admin.diagnostics.booking'].href}>
                    Åpne
                    <Icon name="arrow-right" />
                  </NavLink>
                </CardAction>
              }
            />
            <CardContent>
              <Text as="p" variant="body-sm" className="text-text-secondary">
                Se tilgjengelige booking-flyter og detaljerte hendelser.
              </Text>
            </CardContent>
          </Card>
        </GridCol>
      </CardGrid>
    </CompanyPageTemplate>
  );
}
