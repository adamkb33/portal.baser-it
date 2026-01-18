import type { ApiClientError } from '~/api/clients/http';
import type { Route } from './+types/company.booking.profile.schedule-unavailability.route';
import { CompanyUserScheduleUnavailabilityController, type ScheduleUnavailabilityDto } from '~/api/generated/booking';
import { data, useFetcher } from 'react-router';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormDialog } from '~/components/dialog/form-dialog';
import { withAuth } from '~/api/utils/with-auth';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

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
    const payload = ranges.map((range) => {
      const startDate = range.fromDate;
      const endDate = range.toDate;
      const startTime = range.startTime;
      const endTime = range.endTime;

      if (!startDate || !endDate || !startTime || !endTime) {
        throw new Error('Alle feltene må fylles ut');
      }

      const fromDate = new Date(`${startDate}T${startTime}`);
      const toDate = new Date(`${endDate}T${endTime}`);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new Error('Ugyldig dato eller tid');
      }
      if (fromDate >= toDate) {
        throw new Error('Sluttid må være etter starttid');
      }

      return {
        from: `${startDate}T${normalizeTime(startTime)}`,
        to: `${endDate}T${normalizeTime(endTime)}`,
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

type UnavailabilityRangeFormData = {
  id: string;
  dateRange: DateRange | undefined;
  startTime: string;
  endTime: string;
};

type UnavailabilityFormData = {
  ranges: UnavailabilityRangeFormData[];
};

const createEmptyRange = (): UnavailabilityRangeFormData => ({
  id: String(Date.now()) + Math.random().toString(36).slice(2),
  dateRange: undefined,
  startTime: '',
  endTime: '',
});

const emptyFormData: UnavailabilityFormData = {
  ranges: [createEmptyRange()],
};

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

  const normalizeTimeValue = (value: string) => {
    if (!value) return '';
    const [hours = '00', minutes = '00'] = value.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const buildTimeValue = (base: string, nextHour?: string, nextMinute?: string) => {
    const [hours = '00', minutes = '00'] = normalizeTimeValue(base || '00:00').split(':');
    return `${nextHour ?? hours}:${nextMinute ?? minutes}`;
  };

  const hourOptions = Array.from({ length: 24 }, (_, index) => String((index + 7) % 24).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

  const TimePickerPopover = ({
    value,
    placeholder,
    isOpen,
    onOpenChange,
    onChange,
  }: {
    value: string;
    placeholder: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onChange: (nextValue: string) => void;
  }) => {
    const normalized = normalizeTimeValue(value);
    const [selectedHour, selectedMinute] = normalized ? normalized.split(':') : ['00', '00'];

    return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full h-11 justify-between bg-form-bg border-form-border text-form-text',
              !value && 'text-form-text-muted',
            )}
          >
            <span className="text-sm">{normalized || placeholder}</span>
            <span className="text-xs text-muted-foreground">24t</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-2" align="start">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <p className="text-xs text-form-text-muted">Timer</p>
              <div
                className="h-40 overflow-y-auto overscroll-contain rounded-md border border-form-border bg-form-bg p-1 touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {hourOptions.map((hour) => {
                  const selected = selectedHour === hour;
                  return (
                    <button
                      key={hour}
                      type="button"
                      className={cn(
                        'w-full rounded px-2 py-1 text-left text-sm hover:bg-form-accent/10',
                        selected && 'bg-form-accent/20 text-form-accent font-medium',
                      )}
                      onClick={() => onChange(buildTimeValue(value || '00:00', hour, undefined))}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-form-text-muted">Minutter</p>
              <div
                className="h-40 overflow-y-auto overscroll-contain rounded-md border border-form-border bg-form-bg p-1 touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {minuteOptions.map((minute) => {
                  const selected = selectedMinute === minute;
                  return (
                    <button
                      key={minute}
                      type="button"
                      className={cn(
                        'w-full rounded px-2 py-1 text-left text-sm hover:bg-form-accent/10',
                        selected && 'bg-form-accent/20 text-form-accent font-medium',
                      )}
                      onClick={() => onChange(buildTimeValue(value || '00:00', undefined, minute))}
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-card-border px-2 py-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Ferdig
            </Button>
          </div>
        </PopoverContent>
      </Popover>
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
        {/* Header - Mobile optimized */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Mitt feriefravær</h1>
          <p className="text-sm text-muted-foreground">Administrer når du er utilgjengelig</p>
        </div>

        {/* Primary Action - Bottom third, thumb-friendly */}
        <button
          type="button"
          className="w-full bg-button-primary-bg text-button-primary-text rounded-lg h-14 flex items-center justify-center gap-2 font-medium mb-6 active:bg-button-primary-active-bg"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Legg til fravær
        </button>

        {/* List - Max 5 items visible on mobile */}
        <div className="space-y-3">
          {schedules && schedules.length > 0 ? (
            schedules.slice(0, 5).map((schedule: ScheduleUnavailabilityDto, index: number) => (
              <div key={index} className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <CalendarOff className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-text">
                      {formatDate(schedule.startTime)} – {formatDate(schedule.endTime)}
                    </p>
                  </div>
                </div>
              </div>
            ))
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

      <FormDialog<UnavailabilityFormData>
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Legg til fravær"
        formData={createFormData}
        onFieldChange={() => {}}
        onSubmit={handleCreateSubmit}
        fields={[
          {
            name: 'ranges',
            label: 'Perioder',
            render: ({ value }) => {
              const ranges = (value as UnavailabilityRangeFormData[]) || [];

              return (
                <div className="space-y-4">
                  {ranges.map((range, index) => {
                    const rangeErrors = formErrors[range.id] || {};
                    const label = range.dateRange?.from
                      ? range.dateRange.to
                        ? `${format(range.dateRange.from, 'dd.MM.yyyy')} – ${format(range.dateRange.to, 'dd.MM.yyyy')}`
                        : format(range.dateRange.from, 'dd.MM.yyyy')
                      : 'Velg periode';

                    return (
                      <div key={range.id} className="rounded-lg border border-card-border bg-card p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-card-text">Periode {index + 1}</p>
                          {ranges.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-form-invalid"
                              onClick={() => {
                                setCreateFormData((prev) => ({
                                  ranges: prev.ranges.filter((item) => item.id !== range.id),
                                }));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <Popover
                          open={isDatePickerOpen && activeRangeId === range.id}
                          onOpenChange={(open) => {
                            setIsDatePickerOpen(open);
                            setActiveRangeId(open ? range.id : null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                'w-full justify-between h-11 bg-form-bg border-form-border text-form-text',
                                !range.dateRange?.from && 'text-form-text-muted',
                              )}
                            >
                              <span className="text-sm">{label}</span>
                              <CalendarIcon className="h-4 w-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="range"
                              selected={range.dateRange}
                              onSelect={(nextRange) => handleFieldChange(range.id, 'dateRange', nextRange)}
                              numberOfMonths={1}
                              className="rounded-md border"
                            />
                          </PopoverContent>
                          {rangeErrors.dateRange && (
                            <p className="mt-1.5 text-xs text-form-invalid">{rangeErrors.dateRange}</p>
                          )}
                        </Popover>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-form-text">Starttid</label>
                            <TimePickerPopover
                              value={range.startTime}
                              placeholder="Velg starttid"
                              isOpen={
                                isTimePickerOpen &&
                                activeTimePicker?.rangeId === range.id &&
                                activeTimePicker.field === 'startTime'
                              }
                              onOpenChange={(open) => {
                                setIsTimePickerOpen(open);
                                setActiveTimePicker(open ? { rangeId: range.id, field: 'startTime' } : null);
                              }}
                              onChange={(nextValue) => handleFieldChange(range.id, 'startTime', nextValue)}
                            />
                            {rangeErrors.startTime && (
                              <p className="text-xs text-form-invalid">{rangeErrors.startTime}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-form-text">Sluttid</label>
                            <TimePickerPopover
                              value={range.endTime}
                              placeholder="Velg sluttid"
                              isOpen={
                                isTimePickerOpen &&
                                activeTimePicker?.rangeId === range.id &&
                                activeTimePicker.field === 'endTime'
                              }
                              onOpenChange={(open) => {
                                setIsTimePickerOpen(open);
                                setActiveTimePicker(open ? { rangeId: range.id, field: 'endTime' } : null);
                              }}
                              onChange={(nextValue) => handleFieldChange(range.id, 'endTime', nextValue)}
                            />
                            {(rangeErrors.endTime || formError) && (
                              <p className="text-xs text-form-invalid">{rangeErrors.endTime || formError}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => {
                      setCreateFormData((prev) => ({ ranges: [...prev.ranges, createEmptyRange()] }));
                    }}
                  >
                    Legg til periode
                  </Button>
                </div>
              );
            },
          },
        ]}
        actions={[
          {
            label: 'Avbryt',
            variant: 'outline',
            onClick: () => {
              setIsCreateDialogOpen(false);
              setCreateFormData(emptyFormData);
              setFormErrors({});
              setFormError(null);
            },
          },
          {
            label: 'Lagre',
            variant: 'default',
            type: 'submit',
          },
        ]}
      />
    </div>
  );
}
