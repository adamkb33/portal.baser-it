import type { ApiClientError } from '~/api/clients/http';
import type { Route } from './+types/company.booking.profile.schedule-unavailability.route';
import { CompanyUserScheduleUnavailabilityController, type ScheduleUnavailabilityDto } from '~/api/generated/booking';
import { data, useFetcher } from 'react-router';
import { CalendarOff, Clock, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { withAuth } from '~/api/utils/with-auth';
import { format, isSameDay, startOfDay } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import {
  ScheduleUnavailabilityFormDialog,
  createEmptyRange,
  emptyFormData,
  type UnavailabilityFormData,
  type UnavailabilityRangeFormData,
} from './_components/schedule-unavailability-form-dialog';
import { Button } from '~/components/ui/button';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const getResponse = await withAuth(request, async () => {
      return await CompanyUserScheduleUnavailabilityController.companyUserGetUnavailabilityRanges();
    });

    return data({
      schedules: getResponse.data?.data ?? [],
      error: null as string | null,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return data({ schedules: [], error: error.body.message }, { status: 400 });
    }

    return data({ schedules: [], error: 'Kunne ikke hente fravær' }, { status: 500 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const rangesRaw = String(formData.get('ranges') ?? '[]');
    const ranges = JSON.parse(rangesRaw) as Array<{
      fromDate: string;
      toDate: string;
      startTime: string;
      endTime: string;
    }>;

    if (!Array.isArray(ranges) || ranges.length === 0) {
      return data({ error: 'Legg til minst én periode' }, { status: 400 });
    }

    const normalizeTime = (value: string) => (value.split(':').length === 2 ? `${value}:00` : value);
    const timezone = 'Europe/Oslo';
    const toNorwayIso = (date: string, time: string) => {
      const normalizedTime = normalizeTime(time);
      const localDateTime = `${date}T${normalizedTime}`;
      const utcDate = fromZonedTime(localDateTime, timezone);
      return formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
    };
    const payload = ranges.map((range) => {
      const startDate = range.fromDate;
      const endDate = range.toDate;
      const startTime = range.startTime;
      const endTime = range.endTime;

      if (!startDate || !endDate || !startTime || !endTime) {
        throw new Error('Alle feltene må fylles ut');
      }

      const fromDate = fromZonedTime(`${startDate}T${normalizeTime(startTime)}`, timezone);
      const toDate = fromZonedTime(`${endDate}T${normalizeTime(endTime)}`, timezone);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new Error('Ugyldig dato eller tid');
      }
      if (fromDate >= toDate) {
        throw new Error('Sluttid må være etter starttid');
      }

      return {
        from: toNorwayIso(startDate, startTime),
        to: toNorwayIso(endDate, endTime),
      };
    });

    await withAuth(request, async () => {
      const response = await CompanyUserScheduleUnavailabilityController.companyUserCreateUnavailabilityRanges({
        body: payload,
      });

    });

    return data({ success: true });

  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    return data({ error: error?.message || 'Kunne ikke lagre fravær' }, { status: 400 });
  }
}

export default function CompanyBookingProfileScheduleUnavailabilityRoute({ loaderData }: Route.ComponentProps) {
  const { schedules, error } = loaderData;
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<UnavailabilityFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<
    Record<string, Partial<Record<'dateRange' | 'startTime' | 'endTime', string>>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeRangeId, setActiveRangeId] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<{
    rangeId: string;
    field: 'startTime' | 'endTime';
  } | null>(null);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsCreateDialogOpen(false);
      setCreateFormData(emptyFormData);
      setFormErrors({});
      setFormError(null);
    }
    if (fetcher.data?.error) {
      setFormError(fetcher.data.error);
    }
  }, [fetcher.data]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };
  const formatTime = (dateString: string) => format(new Date(dateString), 'HH:mm');
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isSameDay(startDate, endDate)) return formatDate(start);
    return `${formatDate(start)} – ${formatDate(end)}`;
  };
  const isWholeDay = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (
      isSameDay(startDate, endDate) &&
      format(startDate, 'HH:mm') === '00:00' &&
      format(endDate, 'HH:mm') === '23:59'
    );
  };


  const handleFieldChange = (rangeId: string, field: keyof UnavailabilityRangeFormData, value: any) => {
    setCreateFormData((prev) => ({
      ranges: prev.ranges.map((range) => (range.id === rangeId ? { ...range, [field]: value } : range)),
    }));
    setFormErrors((prev) => ({
      ...prev,
      [rangeId]: { ...(prev[rangeId] || {}), [field]: undefined },
    }));
    setFormError(null);
  };

  const validateRange = (range: UnavailabilityRangeFormData) => {
    const nextErrors: Partial<Record<'dateRange' | 'startTime' | 'endTime', string>> = {};
    if (!range.startTime) nextErrors.startTime = 'Velg starttid';
    if (!range.endTime) nextErrors.endTime = 'Velg sluttid';
    if (!range.dateRange?.from || !range.dateRange?.to) {
      nextErrors.dateRange = 'Velg periode';
    }

    if (Object.keys(nextErrors).length > 0) {
      return { fieldErrors: nextErrors };
    }

    const fromDate = new Date(`${format(range.dateRange!.from!, 'yyyy-MM-dd')}T${range.startTime}`);
    const toDate = new Date(`${format(range.dateRange!.to!, 'yyyy-MM-dd')}T${range.endTime}`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return { fieldErrors: nextErrors, formError: 'Ugyldig dato eller tid' };
    }
    if (fromDate >= toDate) {
      return { fieldErrors: nextErrors, formError: 'Sluttid må være etter starttid' };
    }

    return { fieldErrors: nextErrors };
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, Partial<Record<'dateRange' | 'startTime' | 'endTime', string>>> = {};
    let validationError: string | null = null;

    createFormData.ranges.forEach((range) => {
      const { fieldErrors, formError: rangeError } = validateRange(range);
      if (Object.keys(fieldErrors).length > 0) {
        nextErrors[range.id] = fieldErrors;
      }
      if (rangeError) {
        validationError = rangeError;
      }
    });

    if (Object.keys(nextErrors).length > 0 || validationError) {
      setFormErrors(nextErrors);
      setFormError(validationError ?? null);
      return;
    }

    const formData = new FormData();
    const rangesPayload = createFormData.ranges.map((range) => ({
      fromDate: format(range.dateRange!.from!, 'yyyy-MM-dd'),
      toDate: format(range.dateRange!.to!, 'yyyy-MM-dd'),
      startTime: range.startTime,
      endTime: range.endTime,
    }));
    formData.append('ranges', JSON.stringify(rangesPayload));

    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div className="bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Mitt feriefravær</h1>
          <p className="text-sm text-muted-foreground">Administrer når du er utilgjengelig</p>
        </div>

        <button
          type="button"
          className="w-full bg-button-primary-bg text-button-primary-text rounded-lg h-14 flex items-center justify-center gap-2 font-medium mb-6 active:bg-button-primary-active-bg"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Legg til fravær
        </button>

        <div className="space-y-3">
          {schedules && schedules.length > 0 ? (
            schedules.slice(0, 5).map((schedule: ScheduleUnavailabilityDto, index: number) => {
              const wholeDay = isWholeDay(schedule.startTime, schedule.endTime);
              return (
                <div key={index} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <CalendarOff className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-text truncate">
                        {formatDateRange(schedule.startTime, schedule.endTime)}
                      </p>
                      {!wholeDay && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(schedule.startTime)}–{formatTime(schedule.endTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <CalendarOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {error || 'Ingen fraværsperioder registrert'}
              </p>
            </div>
          )}
        </div>

        {/* Show more affordance if needed */}
        {schedules && schedules.length > 5 && (
          <button className="w-full mt-4 text-sm text-primary font-medium h-11">Vis alle ({schedules.length})</button>
        )}
      </div>

      <ScheduleUnavailabilityFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCancel={() => {
          setIsCreateDialogOpen(false);
          setCreateFormData(emptyFormData);
          setFormErrors({});
          setFormError(null);
        }}
        formData={createFormData}
        onSubmit={handleCreateSubmit}
        formErrors={formErrors}
        formError={formError}
        onFieldChange={handleFieldChange}
        onRemoveRange={(rangeId) => {
          setCreateFormData((prev) => ({
            ranges: prev.ranges.filter((item) => item.id !== rangeId),
          }));
        }}
        onAddRange={() => {
          setCreateFormData((prev) => ({
            ranges: [...prev.ranges, createEmptyRange()],
          }));
        }}
        isDatePickerOpen={isDatePickerOpen}
        setIsDatePickerOpen={setIsDatePickerOpen}
        activeRangeId={activeRangeId}
        setActiveRangeId={setActiveRangeId}
        isTimePickerOpen={isTimePickerOpen}
        setIsTimePickerOpen={setIsTimePickerOpen}
        activeTimePicker={activeTimePicker}
        setActiveTimePicker={setActiveTimePicker}
        today={today}
      />
    </div>
  );
}
