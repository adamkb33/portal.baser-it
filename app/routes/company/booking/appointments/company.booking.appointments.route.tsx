import { useFetcher, useNavigate, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AppointmentDto } from 'tmp/openapi/gen/booking';
import { Button } from '~/components/ui/button';
import { ServerPaginatedTable } from '~/components/table/server-side-table';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Label } from '~/components/ui/label';
import { withAuth } from '~/api/utils/with-auth';
import { CompanyUserAppointmentController } from '~/api/generated/booking';
import { PageHeader } from '../../_components/page-header';
import type { Route } from './+types/company.booking.appointments.route';
import { Card, CardContent } from '~/components/ui/card';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const sort = url.searchParams.get('sort') || '';
    const search = url.searchParams.get('search') || '';
    const fromDateTime = url.searchParams.get('fromDateTime');
    const toDateTime = url.searchParams.get('toDateTime');

    // Default to upcoming appointments ONLY if no date filters are set at all
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

  return (
    <div className="container mx-auto">
      {/* Desktop View */}
      <div className="hidden md:block">
        <ServerPaginatedTable<AppointmentDto>
          items={appointments}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyMessage="Ingen avtaler ennå"
          getRowKey={(appointment, index) => appointment.id ?? `appointment-${index}`}
          columns={[
            { header: 'Tidspunkt', className: 'font-medium' },
            { header: 'Kunde' },
            { header: 'Tjenester' },
            { header: 'Varighet' },
            { header: 'Pris' },
            { header: 'Handlinger' },
          ]}
          headerSlot={
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Søk på tjenestenavn eller gruppe…"
                    value={searchFilter}
                    onChange={(event) => handleSearchChange(event.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fromDate" className="text-xs">
                      Fra dato
                    </Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-[140px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="toDate" className="text-xs">
                      Til dato
                    </Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-[140px]"
                    />
                  </div>

                  <Button onClick={applyDateFilters} size="sm">
                    Filtrer
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleUpcomingFilter}>
                  Kommende
                </Button>
                <Button variant="outline" size="sm" onClick={handlePastFilter}>
                  Tidligere
                </Button>
                <Button variant="outline" size="sm" onClick={handleTodayFilter}>
                  I dag
                </Button>
                <Button variant="outline" size="sm" onClick={handleThisWeekFilter}>
                  Denne uken
                </Button>
                <Button variant="outline" size="sm" onClick={handleThisMonthFilter}>
                  Denne måneden
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Nullstill filtre
                </Button>
              </div>
            </div>
          }
          renderRow={(appointment) => (
            <TableRow>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{formatDateTime(appointment.startTime)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="h-7">
                      {appointment.contact.givenName + ' ' + appointment.contact.familyName}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Kundeinformasjon</h4>
                      <div className="space-y-2 text-sm">
                        {appointment.contact.givenName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fornavn:</span>
                            <span className="font-medium">{appointment.contact.givenName}</span>
                          </div>
                        )}
                        {appointment.contact.familyName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Etternavn:</span>
                            <span className="font-medium">{appointment.contact.familyName}</span>
                          </div>
                        )}
                        {appointment.contact.email?.value && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">E-post:</span>
                            <span className="font-medium">{appointment.contact.email.value}</span>
                          </div>
                        )}
                        {appointment.contact.mobileNumber?.value && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Telefon:</span>
                            <span className="font-medium">{appointment.contact.mobileNumber.value}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell>
                {getTotalServiceCount(appointment) > 1 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="link" size="sm" className="h-7">
                        Se tjenester ({getTotalServiceCount(appointment)})
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Tjenester</h4>
                        {appointment.groupedServiceGroups?.map((group) => (
                          <div key={group.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-semibold">
                                {group.name}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pl-2">
                              {group.services?.map((service) => (
                                <Badge key={service.id} variant="secondary" className="font-normal text-xs">
                                  {service.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{appointment.groupedServiceGroups?.[0]?.name}</span>
                    <span className="text-sm font-medium">
                      {appointment.groupedServiceGroups?.[0]?.services?.[0]?.name}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>{getTotalDuration(appointment)}</TableCell>
              <TableCell>{getTotalPrice(appointment)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleDeleteClick(appointment.id!)}
                    disabled={fetcher.state !== 'idle' && deletingAppointmentId === appointment.id}
                  >
                    Slett
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        />
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {/* Filters */}
        <div className="space-y-3 border border-border bg-background p-4">
          <Input
            placeholder="Søk..."
            value={searchFilter}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant="outline" size="sm" onClick={handleUpcomingFilter} className="whitespace-nowrap">
              Kommende
            </Button>
            <Button variant="outline" size="sm" onClick={handleTodayFilter} className="whitespace-nowrap">
              I dag
            </Button>
            <Button variant="outline" size="sm" onClick={handleThisWeekFilter} className="whitespace-nowrap">
              Uken
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="whitespace-nowrap">
              Nullstill
            </Button>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{formatDateTime(appointment.startTime)}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.contact.givenName} {appointment.contact.familyName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-8"
                      onClick={() => handleDeleteClick(appointment.id!)}
                      disabled={fetcher.state !== 'idle' && deletingAppointmentId === appointment.id}
                    >
                      Slett
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    {getTotalServiceCount(appointment) > 1 ? (
                      <div>
                        <span className="text-muted-foreground">Tjenester: </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0">
                              {getTotalServiceCount(appointment)} tjenester
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-3">
                              {appointment.groupedServiceGroups?.map((group) => (
                                <div key={group.id} className="space-y-2">
                                  <Badge variant="outline" className="font-semibold">
                                    {group.name}
                                  </Badge>
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.services?.map((service) => (
                                      <Badge key={service.id} variant="secondary" className="text-xs">
                                        {service.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {appointment.groupedServiceGroups?.[0]?.name}
                        </span>
                        <p className="font-medium">{appointment.groupedServiceGroups?.[0]?.services?.[0]?.name}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div>
                        <span className="text-muted-foreground">Varighet: </span>
                        <span className="font-medium">{getTotalDuration(appointment)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pris: </span>
                        <span className="font-medium">{getTotalPrice(appointment)}</span>
                      </div>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          Se kontaktinfo
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2 text-sm">
                          {appointment.contact.email?.value && (
                            <div>
                              <span className="text-muted-foreground">E-post: </span>
                              <span className="font-medium">{appointment.contact.email.value}</span>
                            </div>
                          )}
                          {appointment.contact.mobileNumber?.value && (
                            <div>
                              <span className="text-muted-foreground">Telefon: </span>
                              <span className="font-medium">{appointment.contact.mobileNumber.value}</span>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border">
              <CardContent className="p-8 text-center text-muted-foreground">Ingen avtaler ennå</CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {appointments.length > 0 && (
          <div className="border border-border bg-background p-4 space-y-3">
            <div className="text-xs text-muted-foreground text-center">
              Side {pagination.page + 1} / {pagination.totalPages || 1}
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages - 1}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>

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
