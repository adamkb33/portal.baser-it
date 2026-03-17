import { useEffect, useMemo, useRef, useState } from 'react';
import { data, useNavigate, useSearchParams, useSubmit } from 'react-router';
import type { DateRange } from 'react-day-picker';
import { BellRing, Eye, Inbox } from 'lucide-react';
import type { Route } from './+types/company.notifications.route';
import { CompanyUserInAppNotificationController, type InAppNotificationDto } from '~/api/generated/notification';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { serializeQueryParams } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/route-tree';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { CompanyMetricCard, CompanyPageTemplate, Notice } from '~/ui';
import { NotificationsFilterCard } from './_components/notifications-filter-card';
import { NotificationCardRow } from './_components/notification-card-row';
import { NotificationTableRow } from './_components/notification-table-row';
import { NotificationPaginationService } from './_utils/pagination-service';
import { parseNotificationListRequest } from './_utils/query';
import { parseIsoDate, toIsoDate } from '../timesheet/_utils';

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
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

  const handleRangeSelect = (nextRange: DateRange | undefined) => {
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
      description="Varsler, lesestatus og filtre presentert i samme kompakte mønster som resten av company-flatene."
      label="Varsler"
      hero={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CompanyMetricCard label="Totalt i listen" value={summary.total} icon={<Inbox className="h-5 w-5" />} />
          <CompanyMetricCard label="Uleste" value={summary.unread} icon={<BellRing className="h-5 w-5" />} />
          <CompanyMetricCard label="Leste" value={summary.read} icon={<Eye className="h-5 w-5" />} />
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
              onOpen={openNotificationRoute}
            />
          )}
          renderRow={(notification) => (
            <NotificationTableRow
              notification={notification}
              isViewed={isViewed(notification)}
              onOpen={openNotificationRoute}
            />
          )}
        />
      )}
    </CompanyPageTemplate>
  );
}
