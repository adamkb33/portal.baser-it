import { useFetcher, useNavigate, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AppointmentDto } from 'tmp/openapi/gen/booking';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { withAuth } from '~/api/utils/with-auth';
import { CompanyUserAppointmentController } from '~/api/generated/booking';
import type { Route } from './+types/company.booking.appointments.route';
import { AppointmentCardRow } from './_components/appointment.card-row';
import { AppointmentTableHeaderSlot } from './_components/appointment.table-header-slot';
import { AppointmentTableRow } from './_components/appointment.table-row';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const sort = url.searchParams.get('sort') || '';
    const search = url.searchParams.get('search') || '';
    const fromDateTime = url.searchParams.get('fromDateTime');
    const toDateTime = url.searchParams.get('toDateTime');

    const hasDateFilters = fromDateTime !== null || toDateTime !== null;
    const now = new Date().toISOString();
    const effectiveFromDateTime = hasDateFilters ? fromDateTime : now;
    const effectiveToDateTime = hasDateFilters ? toDateTime : null;

    const appointmentsResponse = await withAuth(request, async () => {
      return CompanyUserAppointmentController.getAppointments({
        query: {
          page,
          size,
          ...(sort && { sort }),
          ...(search && { search }),
          ...(effectiveFromDateTime && { fromDateTime: effectiveFromDateTime }),
          ...(effectiveToDateTime && { toDateTime: effectiveToDateTime }),
        },
      });
    });

    const apiResponse = appointmentsResponse.data;
    const pageData = apiResponse?.data;

    return {
      appointments: pageData?.content || [],
      pagination: {
        page: pageData?.page ?? 0,
        size: pageData?.size ?? size,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 1,
      },
      filters: {
        sort,
        search,
        fromDateTime: fromDateTime || '',
        toDateTime: toDateTime || '',
      },
    };
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    return {
      appointments: [],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      },
      filters: {
        sort: '',
        search: '',
        fromDateTime: '',
        toDateTime: '',
      },
      error: error?.message || 'Kunne ikke hente timebestillinger',
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
    const id = formData.get('id');
    if (!id) {
      return { success: false, message: 'Mangler ID' };
    }

    try {
      await withAuth(request, async () => {
        return CompanyUserAppointmentController.deleteAppointment({
          path: { id: Number(id) },
        });
      });

      return { success: true, message: 'Timebestilling slettet' };
    } catch (error: any) {
      console.error('Delete appointment error:', error);
      return {
        success: false,
        message: error?.body?.message || 'Kunne ikke slette timebestilling',
      };
    }
  }

  return { success: false, message: 'Ukjent handling' };
}

export default function CompanyBookingAppointmentsPage({ loaderData }: Route.ComponentProps) {
  const { appointments, pagination, filters } = loaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState(filters?.search || '');
  const [fromDate, setFromDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toDate, setToDate] = useState('');
  const [toTime, setToTime] = useState('');

  useEffect(() => {
    if (filters?.fromDateTime) {
      const fromDt = new Date(filters.fromDateTime);
      setFromDate(fromDt.toISOString().split('T')[0]);
      setFromTime(fromDt.toTimeString().slice(0, 5));
    }
    if (filters?.toDateTime) {
      const toDt = new Date(filters.toDateTime);
      setToDate(toDt.toISOString().split('T')[0]);
      setToTime(toDt.toTimeString().slice(0, 5));
    }
  }, [filters]);

  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;

    if (fetcher.data.success) {
      toast.success(fetcher.data.message ?? 'Handling fullført');
      setIsDeleteDialogOpen(false);
      setDeletingAppointmentId(null);
    } else if (fetcher.data.message) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher.state, fetcher.data]);

  const handleDeleteClick = (id: number) => {
    setDeletingAppointmentId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAppointmentId) return;

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(deletingAppointmentId));

    fetcher.submit(fd, { method: 'post' });
  };

  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const applyDateFilters = () => {
    const params = new URLSearchParams(searchParams);

    if (fromDate) {
      const fromDateTime = `${fromDate}T${fromTime || '00:00:00'}`;
      params.set('fromDateTime', fromDateTime);
    } else {
      params.delete('fromDateTime');
    }

    if (toDate) {
      const toDateTime = `${toDate}T${toTime || '23:59:59'}`;
      params.set('toDateTime', toDateTime);
    } else {
      params.delete('toDateTime');
    }

    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleQuickFilter = (from: string, to: string) => {
    const params = new URLSearchParams(searchParams);

    if (from) {
      params.set('fromDateTime', from);
      const fromDt = new Date(from);
      setFromDate(fromDt.toISOString().split('T')[0]);
      setFromTime(fromDt.toTimeString().slice(0, 5));
    } else {
      params.delete('fromDateTime');
      setFromDate('');
      setFromTime('');
    }

    if (to) {
      params.set('toDateTime', to);
      const toDt = new Date(to);
      setToDate(toDt.toISOString().split('T')[0]);
      setToTime(toDt.toTimeString().slice(0, 5));
    } else {
      params.delete('toDateTime');
      setToDate('');
      setToTime('');
    }

    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleUpcomingFilter = () => {
    const now = new Date().toISOString();
    handleQuickFilter(now, '');
  };

  const handlePastFilter = () => {
    const now = new Date().toISOString();
    handleQuickFilter('', now);
  };

  const handleTodayFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setSeconds(tomorrow.getSeconds() - 1);
    handleQuickFilter(today.toISOString(), tomorrow.toISOString());
  };

  const handleThisWeekFilter = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setSeconds(endOfWeek.getSeconds() - 1);
    handleQuickFilter(startOfWeek.toISOString(), endOfWeek.toISOString());
  };

  const handleThisMonthFilter = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    handleQuickFilter(startOfMonth.toISOString(), endOfMonth.toISOString());
  };

  const handleClearFilters = () => {
    setSearchFilter('');
    setFromDate('');
    setFromTime('');
    setToDate('');
    setToTime('');
    navigate('?', { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('size', newSize.toString());
    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('nb-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalPrice = (appointment: AppointmentDto) => {
    const allServices = appointment.groupedServiceGroups?.flatMap((group) => group.services ?? []) ?? [];
    const total = allServices.reduce((sum, service) => sum + (service.price ?? 0), 0);
    return total.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' });
  };

  const getTotalDuration = (appointment: AppointmentDto) => {
    const allServices = appointment.groupedServiceGroups?.flatMap((group) => group.services ?? []) ?? [];
    const total = allServices.reduce((sum, service) => sum + (service.duration ?? 0), 0);
    return `${total} min`;
  };

  const getTotalServiceCount = (appointment: AppointmentDto) => {
    return appointment.groupedServiceGroups?.reduce((sum, group) => sum + (group.services?.length ?? 0), 0) ?? 0;
  };

  const handleRemoveFilter = (filterType: 'search' | 'fromDate' | 'toDate') => {
    const params = new URLSearchParams(searchParams);

    switch (filterType) {
      case 'search':
        params.delete('search');
        setSearchFilter('');
        break;
      case 'fromDate':
        params.delete('fromDateTime');
        setFromDate('');
        setFromTime('');
        break;
      case 'toDate':
        params.delete('toDateTime');
        setToDate('');
        setToTime('');
        break;
    }

    params.set('page', '0');
    navigate(`?${params.toString()}`, { replace: true });
  };

  return (
    <div className="container mx-auto">
      {/* Desktop View */}
      <ServerPaginatedTable<AppointmentDto>
        items={appointments}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        emptyMessage="Ingen avtaler ennå"
        getRowKey={(appointment, index) => appointment.id ?? `appointment-${index}`}
        renderMobileCard={(appointment) => (
          <AppointmentCardRow
            appointment={appointment}
            onDelete={handleDeleteClick}
            isDeleting={fetcher.state !== 'idle' && deletingAppointmentId === appointment.id}
            formatDateTime={formatDateTime}
            getTotalDuration={getTotalDuration}
            getTotalPrice={getTotalPrice}
            getTotalServiceCount={getTotalServiceCount}
          />
        )}
        columns={[
          { header: 'Tidspunkt', className: 'font-medium' },
          { header: 'Kunde' },
          { header: 'Tjenester' },
          { header: 'Varighet' },
          { header: 'Pris' },
          { header: 'Handlinger' },
        ]}
        headerSlot={
          <AppointmentTableHeaderSlot
            onRemoveFilter={handleRemoveFilter}
            searchFilter={searchFilter}
            onSearchChange={handleSearchChange}
            fromDate={fromDate}
            fromTime={fromTime}
            toDate={toDate}
            toTime={toTime}
            onFromDateChange={setFromDate}
            onFromTimeChange={setFromTime}
            onToDateChange={setToDate}
            onToTimeChange={setToTime}
            onApplyDateFilters={applyDateFilters}
            onUpcomingFilter={handleUpcomingFilter}
            onPastFilter={handlePastFilter}
            onTodayFilter={handleTodayFilter}
            onThisWeekFilter={handleThisWeekFilter}
            onThisMonthFilter={handleThisMonthFilter}
            onClearFilters={handleClearFilters}
          />
        }
        mobileHeaderSlot={
          <AppointmentTableHeaderSlot
            onRemoveFilter={handleRemoveFilter}
            searchFilter={searchFilter}
            onSearchChange={handleSearchChange}
            fromDate={fromDate}
            fromTime={fromTime}
            toDate={toDate}
            toTime={toTime}
            onFromDateChange={setFromDate}
            onFromTimeChange={setFromTime}
            onToDateChange={setToDate}
            onToTimeChange={setToTime}
            onApplyDateFilters={applyDateFilters}
            onUpcomingFilter={handleUpcomingFilter}
            onPastFilter={handlePastFilter}
            onTodayFilter={handleTodayFilter}
            onThisWeekFilter={handleThisWeekFilter}
            onThisMonthFilter={handleThisMonthFilter}
            onClearFilters={handleClearFilters}
          />
        }
        renderRow={(appointment) => (
          <AppointmentTableRow
            appointment={appointment}
            onDelete={handleDeleteClick}
            isDeleting={fetcher.state !== 'idle' && deletingAppointmentId === appointment.id}
            formatDateTime={formatDateTime}
            getTotalDuration={getTotalDuration}
            getTotalPrice={getTotalPrice}
            getTotalServiceCount={getTotalServiceCount}
          />
        )}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Slett timebestilling?"
        description="Er du sikker på at du vil slette denne timebestillingen? Denne handlingen kan ikke angres."
      />
    </div>
  );
}
