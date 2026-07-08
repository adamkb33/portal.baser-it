import { useEffect, useMemo, useRef, useState } from 'react';
import { data, useNavigate, useSearchParams, useSubmit } from 'react-router';
import { BellRing, Eye, Inbox } from 'lucide-react';
import type { Route } from './+types/company.notifications.route';
import { CompanyUserInAppNotificationController, type InAppNotificationDto } from '~/api/generated/notification';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { serializeQueryParams } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { Badge, CompanyPageTemplate, Notice } from '~/ui';
import { NotificationsFilterCard } from './_components/notifications-filter-card';
import { NotificationCardRow } from './_components/notification-card-row';
import { NotificationTableRow } from './_components/notification-table-row';
import { NotificationPaginationService } from './_utils/pagination-service';
import { parseNotificationListRequest } from './_utils/query';
import { parseIsoDate, toIsoDate } from '../timesheet/_utils';
import type { CalendarDateRange } from '~/ui';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const { filters, requestPayload } = parseNotificationListRequest(url);

  try {
    const response = await withAuth(request, () =>
      CompanyUserInAppNotificationController.getInAppNotifications({
        query: {
          request: requestPayload,
        },
        paramsSerializer: (params) => serializeQueryParams(params.request),
      }),
    );

    const pageData = response.data?.data;

    return data({
      notifications: pageData?.content ?? [],
      pagination: {
        page: pageData?.page ?? filters.page,
        size: pageData?.size ?? filters.size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
      filters,
      error: null as string | null,
    });
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente varsler');
    return data({
      notifications: [] as InAppNotificationDto[],
      pagination: {
        page: filters.page,
        size: filters.size,
        totalElements: 0,
        totalPages: 1,
      },
      filters,
      error: message,
    });
  }
}

export function getAppointmentNotificationHref(
  notification: Pick<InAppNotificationDto, 'sourceRefType' | 'sourceRefId'>,
): string | null {
  if (notification.sourceRefType !== 'APPOINTMENT') {
    return null;
  }

  const sourceRefId = notification.sourceRefId?.trim();
  if (!sourceRefId || !/^\d+$/.test(sourceRefId)) {
    return null;
  }

  return ROUTES_MAP['company.booking.appointments.detail'].href.replace(':appointmentId', sourceRefId);
}

export default function CompanyNotificationsRoute({ loaderData }: Route.ComponentProps) {
  const { notifications, pagination, filters, error } = loaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fromDate, setFromDate] = useState(filters.fromDate ?? '');
  const [toDate, setToDate] = useState(filters.toDate ?? '');
  const [readFilter, setReadFilter] = useState(filters.read);
  const [dateRange, setDateRange] = useState<CalendarDateRange | undefined>({
    from: parseIsoDate(filters.fromDate),
    to: parseIsoDate(filters.toDate),
  });

  const paginationService = useMemo(
    () => new NotificationPaginationService(searchParams, navigate),
    [searchParams, navigate],
  );

  useEffect(() => {
    setFromDate(filters.fromDate ?? '');
    setToDate(filters.toDate ?? '');
    setReadFilter(filters.read);
    setDateRange({
      from: parseIsoDate(filters.fromDate),
      to: parseIsoDate(filters.toDate),
    });
  }, [filters.fromDate, filters.toDate, filters.read]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const isViewed = (notification: InAppNotificationDto) => notification.readAt != null;

  const openNotificationRoute = (notification: InAppNotificationDto) => {
    const appointmentHref = getAppointmentNotificationHref(notification);
    if (appointmentHref) {
      navigate(appointmentHref);
      return;
    }

    const href = ROUTES_MAP['company.notifications.view'].href.replace(':id', notification.id.toString());
    const search = searchParams.toString();

    navigate(`${href}${search ? `?${search}` : ''}`);
  };

  const submitDebounced = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!formRef.current) {
        return;
      }
      submit(formRef.current, { replace: true, preventScrollReset: true });
    }, 1000);
  };

  const handleRangeSelect = (nextRange: CalendarDateRange | undefined) => {
    setDateRange(nextRange);
    setFromDate(toIsoDate(nextRange?.from));
    setToDate(toIsoDate(nextRange?.to));
    submitDebounced();
  };

  const handleReadFilterChange = (value: 'all' | 'read' | 'unread') => {
    setReadFilter(value);
    submitDebounced();
  };

  const summary = useMemo(() => {
    return notifications.reduce(
      (acc, notification) => {
        acc.total += 1;
        if (isViewed(notification)) {
          acc.read += 1;
        } else {
          acc.unread += 1;
        }
        return acc;
      },
      { total: 0, read: 0, unread: 0 },
    );
  }, [notifications]);

  return (
    <CompanyPageTemplate
      title="In-app varsler"
      label="Varsler"
      description="Varsler og lenker fra systemet."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="md">
            <Inbox className="h-3.5 w-3.5" />
            {summary.total} totalt
          </Badge>
          <Badge variant="warning" size="md">
            <BellRing className="h-3.5 w-3.5" />
            {summary.unread} uleste
          </Badge>
          <Badge variant="success" size="md">
            <Eye className="h-3.5 w-3.5" />
            {summary.read} leste
          </Badge>
        </div>
      }
    >
      <NotificationsFilterCard
        formRef={formRef}
        fromDate={fromDate}
        toDate={toDate}
        dateRange={dateRange}
        readFilter={readFilter}
        pageSize={pagination.size}
        resetHref="/company/notifications"
        onRangeSelect={handleRangeSelect}
        onReadFilterChange={handleReadFilterChange}
      />

      {error ? (
        <Notice tone="emphasis" title="Kunne ikke hente varsler" message={error} />
      ) : (
        <ServerPaginatedTable<InAppNotificationDto>
          items={notifications}
          columns={[{ header: 'Tidspunkt' }, { header: 'Varsel' }, { header: 'Status' }]}
          pagination={pagination}
          onPageChange={paginationService.handlePageChange}
          onPageSizeChange={paginationService.handlePageSizeChange}
          emptyMessage="Ingen varsler funnet for valgte filtre."
          getRowKey={(notification) => notification.id}
          renderMobileCard={(notification) => (
            <NotificationCardRow
              notification={notification}
              isViewed={isViewed(notification)}
              appointmentHref={getAppointmentNotificationHref(notification)}
              onOpen={openNotificationRoute}
            />
          )}
          renderRow={(notification) => (
            <NotificationTableRow
              notification={notification}
              isViewed={isViewed(notification)}
              appointmentHref={getAppointmentNotificationHref(notification)}
              onOpen={openNotificationRoute}
            />
          )}
        />
      )}
    </CompanyPageTemplate>
  );
}
