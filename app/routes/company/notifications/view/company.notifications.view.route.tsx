import { data, Link, useLocation } from 'react-router';
import { ArrowLeft, BellRing, Clock3, Eye } from 'lucide-react';
import type { Route } from './+types/company.notifications.view.route';
import { CompanyUserInAppNotificationController } from '~/api/generated/notification';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { Button, CompanyPageTemplate, KeyValueList, KpiCard, Panel, Text } from '~/ui';
import { formatNotificationTimestamp } from '../_utils/format';
import { getNotificationHeadline } from '../_utils/query';

function parseNotificationId(idParam: string | undefined): number | null {
  if (!idParam) {
    return null;
  }

  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const id = parseNotificationId(params.id);
  if (id == null) {
    throw new Response('Ugyldig varsel-ID', { status: 400 });
  }

  try {
    const response = await withAuth(request, () =>
      CompanyUserInAppNotificationController.getInAppNotificationById({
        path: { id },
      }),
    );

    let notification = response.data?.data;
    if (!notification) {
      throw new Response('Fant ikke varselet', { status: 404 });
    }

    if (!notification.readAt) {
      const markAsReadResponse = await withAuth(request, () =>
        CompanyUserInAppNotificationController.markInAppNotificationAsRead({
          path: { id },
        }),
      );

      notification = markAsReadResponse.data?.data ?? notification;
    }

    return data({ notification });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente varselet');
    throw new Response(message, { status: status ?? 400 });
  }
}

export default function CompanyNotificationsViewRoute({ loaderData }: Route.ComponentProps) {
  const { notification } = loaderData;
  const location = useLocation();
  const search = location.search;
  const backHref = `${ROUTES_MAP['company.notifications'].href}${search}`;
  const isViewed = notification.readAt != null;

  return (
    <CompanyPageTemplate
      title={getNotificationHeadline(notification)}
      description="Detaljvisning av ett varsel i samme kompakte sideoppsett som resten av company-domenet."
      label="Varseldetaljer"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to={backHref}>
            <ArrowLeft className="h-4 w-4" />
            Tilbake til varsler
          </Link>
        </Button>
      }
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard label="Status" value={isViewed ? 'Lest' : 'Ulest'} icon={<Eye className="h-5 w-5" />} tone={isViewed ? 'success' : 'warning'} />
          <KpiCard label="Varsel-ID" value={`#${notification.id}`} icon={<BellRing className="h-5 w-5" />} tone="info" />
          <KpiCard
            label="Opprettet"
            value={formatNotificationTimestamp(notification.createdAt)}
            icon={<Clock3 className="h-5 w-5" />}
            tone="primary"
          />
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Panel title="Innhold" description="Hele meldingsteksten for varslet.">
          <Text as="p" variant="body-sm" className="whitespace-pre-wrap break-words leading-7">
            {notification.content}
          </Text>
        </Panel>

        <Panel title="Detaljer" description="Teknisk og funksjonell status for varslet.">
          <KeyValueList
            layout="stacked"
            items={[
              { label: 'Opprettet', value: formatNotificationTimestamp(notification.createdAt) },
              { label: 'Oppdatert', value: formatNotificationTimestamp(notification.updatedAt ?? notification.createdAt) },
              { label: 'Lest', value: notification.readAt ? formatNotificationTimestamp(notification.readAt) : 'Ikke lest ennå' },
            ]}
          />
        </Panel>
      </div>
    </CompanyPageTemplate>
  );
}
