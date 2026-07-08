import { data, redirect } from 'react-router';
import type { Route } from './+types/company.booking.schedule-unavailability.create.route';
import type React from 'react';
import { useState } from 'react';
import { useNavigate, useNavigation, useSubmit } from 'react-router';
import { addMinutes, format, isSameDay, startOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { CompanyUserScheduleUnavailabilityController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { StartEndTimeSelector } from '~/components/pickers/start-end-time-selector';
import { resolveErrorPayload } from '~/lib/api-error';
import { setFlashMessage } from '~/lib/flash-message.server';
import { formatLocalDateTimeInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { cn } from '~/lib/utils';
import { Button, Calendar, CompanyFormPageTemplate, Notice, Popover, PopoverContent, PopoverTrigger, Text } from '~/ui';

type UnavailabilityDateRange = {
  from?: Date;
  to?: Date;
};

type UnavailabilityRangeFormData = {
  id: string;
  dateRange: UnavailabilityDateRange | undefined;
  startTime: string;
  endTime: string;
};

type UnavailabilityFormData = {
  ranges: UnavailabilityRangeFormData[];
};

function createEmptyRange(): UnavailabilityRangeFormData {
  const today = startOfDay(new Date());
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    dateRange: { from: today, to: today },
    startTime: '',
    endTime: '',
  };
}

const emptyFormData: UnavailabilityFormData = {
  ranges: [createEmptyRange()],
};

function resolveRedirectTo(value: string | null): string {
  if (!value) return ROUTES_MAP['company.booking.schedule-unavailability'].href;
  if (!value.startsWith('/')) return ROUTES_MAP['company.booking.schedule-unavailability'].href;
  return value;
}

function parsePrefillRange(searchParams: URLSearchParams): UnavailabilityRangeFormData | null {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!from || !to) return null;

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) return null;

  return {
    id: createEmptyRange().id,
    dateRange: {
      from: startOfDay(fromDate),
      to: startOfDay(toDate),
    },
    startTime: format(fromDate, 'HH:mm'),
    endTime: format(toDate, 'HH:mm'),
  };
}

function isPastPrefillRange(searchParams: URLSearchParams): boolean {
  const to = searchParams.get('to');
  if (!to) return false;
  const toDate = new Date(to);
  if (Number.isNaN(toDate.getTime())) return false;
  return toDate.getTime() < Date.now();
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = resolveRedirectTo(url.searchParams.get('redirectTo'));
  if (isPastPrefillRange(url.searchParams)) {
    const flashCookie = await setFlashMessage(request, { type: 'error', text: 'Tidligere fravær kan ikke redigeres' });
    return redirect(redirectTo, { headers: { 'Set-Cookie': flashCookie } });
  }

  return data({
    prefillRange: parsePrefillRange(url.searchParams),
    redirectTo,
  });
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const url = new URL(request.url);
    const redirectTo = resolveRedirectTo(url.searchParams.get('redirectTo'));
    const formData = await request.formData();
    const rangesRaw = String(formData.get('ranges') ?? '[]');
    const ranges = JSON.parse(rangesRaw) as Array<{
      fromDate: string;
      toDate: string;
      startTime: string;
      endTime: string;
    }>;

    if (!Array.isArray(ranges) || ranges.length === 0) {
      const error = 'Legg til minst én periode';
      const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
      return data({ error }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
    }

    const normalizeTime = (value: string) => (value.split(':').length === 2 ? `${value}:00` : value);
    const timezone = 'Europe/Oslo';
    const payload = ranges.map((range) => {
      const fromDate = fromZonedTime(`${range.fromDate}T${normalizeTime(range.startTime)}`, timezone);
      const toDate = fromZonedTime(`${range.toDate}T${normalizeTime(range.endTime)}`, timezone);

      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
        throw new Error('Ugyldig dato eller tid');
      }

      return {
        from: formatLocalDateTimeInTimeZone(range.fromDate, range.startTime, timezone),
        to: formatLocalDateTimeInTimeZone(range.toDate, range.endTime, timezone),
      };
    });

    await withAuth(request, async () => {
      await CompanyUserScheduleUnavailabilityController.companyUserCreateUnavailabilityRanges({ body: payload });
    });

    return redirect(redirectTo);
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke lagre fravær');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ error: message }, { status: status ?? 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyBookingScheduleUnavailabilityCreatePage({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [formData, setFormData] = useState<UnavailabilityFormData>(() => ({
    ranges: loaderData.prefillRange ? [loaderData.prefillRange] : emptyFormData.ranges,
  }));
  const [formErrors, setFormErrors] = useState<
    Record<string, Partial<Record<'dateRange' | 'startTime' | 'endTime', string>>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeRangeId, setActiveRangeId] = useState<string | null>(null);
  const today = startOfDay(new Date());
  const backLabel = loaderData.redirectTo.startsWith(ROUTES_MAP['company.booking.schedule'].href)
    ? 'Tilbake til ukeplan'
    : 'Tilbake til fravær';

  const isSingleDayRange = (range: UnavailabilityRangeFormData) =>
    !!range.dateRange?.from && !!range.dateRange?.to && isSameDay(range.dateRange.from, range.dateRange.to);

  const getEffectiveTimes = (range: UnavailabilityRangeFormData) => {
    const isTodayRange = !!range.dateRange?.from && isSameDay(range.dateRange.from, new Date());
    const nextMinute = format(addMinutes(new Date(), 1), 'HH:mm');
    const currentTime = format(new Date(), 'HH:mm');
    const normalizeStartTime = (value: string) => (isTodayRange && value <= currentTime ? nextMinute : value);

    if (!isSingleDayRange(range)) {
      const rangeStartTime = isTodayRange ? nextMinute : '00:00';
      return { startTime: normalizeStartTime(rangeStartTime), endTime: '23:59' };
    }

    const requestedStartTime = range.startTime || (isTodayRange ? nextMinute : '00:00');
    return { startTime: normalizeStartTime(requestedStartTime), endTime: range.endTime || '23:59' };
  };

  const validateRange = (range: UnavailabilityRangeFormData) => {
    const nextErrors: Partial<Record<'dateRange' | 'startTime' | 'endTime', string>> = {};
    if (!range.dateRange?.from || !range.dateRange?.to) {
      nextErrors.dateRange = 'Velg periode';
      return { fieldErrors: nextErrors };
    }

    const { startTime, endTime } = getEffectiveTimes(range);
    const fromDate = new Date(`${format(range.dateRange.from, 'yyyy-MM-dd')}T${startTime}`);
    const toDate = new Date(`${format(range.dateRange.to, 'yyyy-MM-dd')}T${endTime}`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return { fieldErrors: nextErrors, formError: 'Ugyldig dato eller tid' };
    }

    if (isSingleDayRange(range) && fromDate <= new Date()) {
      return { fieldErrors: nextErrors, formError: 'Starttid må være i fremtiden' };
    }

    if (fromDate >= toDate) {
      return { fieldErrors: nextErrors, formError: 'Sluttid må være etter starttid' };
    }

    return { fieldErrors: nextErrors };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, Partial<Record<'dateRange' | 'startTime' | 'endTime', string>>> = {};
    let nextFormError: string | null = null;

    formData.ranges.forEach((range) => {
      const { fieldErrors, formError: rangeError } = validateRange(range);
      if (Object.keys(fieldErrors).length > 0) {
        nextErrors[range.id] = fieldErrors;
      }
      if (rangeError && !nextFormError) {
        nextFormError = rangeError;
      }
    });

    if (Object.keys(nextErrors).length > 0 || nextFormError) {
      setFormErrors(nextErrors);
      setFormError(nextFormError);
      return;
    }

    const postFormData = new FormData();
    postFormData.append(
      'ranges',
      JSON.stringify(
        formData.ranges.map((range) => {
          const { startTime, endTime } = getEffectiveTimes(range);
          return {
            fromDate: format(range.dateRange!.from!, 'yyyy-MM-dd'),
            toDate: format(range.dateRange!.to!, 'yyyy-MM-dd'),
            startTime,
            endTime,
          };
        }),
      ),
    );

    submit(postFormData, { method: 'post' });
  };

  return (
    <CompanyFormPageTemplate
      title="Legg til fravær"
      description="Planlegg fravær som en egen ruteside i stedet for et overlegg. Hold oversikten ryddig og konsistent med resten av bookingområdet."
      backLink={{ to: loaderData.redirectTo, label: backLabel }}
      notices={formError ? <Notice tone="emphasis" title="Kunne ikke lagre fravær" message={formError} /> : null}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => navigate(loaderData.redirectTo)}>
            Avbryt
          </Button>
          <Button type="submit" form="schedule-unavailability-form" loading={isSubmitting}>
            Lagre fravær
          </Button>
        </>
      }
    >
      <form id="schedule-unavailability-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-3">
          {formData.ranges.map((range, index) => {
            const rangeErrors = formErrors[range.id] || {};
            const isSingleDay =
              !!range.dateRange?.from && !!range.dateRange?.to && isSameDay(range.dateRange.from, range.dateRange.to);
            const label = range.dateRange?.from
              ? range.dateRange.to
                ? `${format(range.dateRange.from, 'dd.MM.yyyy')} – ${format(range.dateRange.to, 'dd.MM.yyyy')}`
                : format(range.dateRange.from, 'dd.MM.yyyy')
              : 'Velg periode';

            return (
              <div key={range.id} className="space-y-3 border-b border-border pb-4 last:border-b-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <Text as="p" variant="label" className="text-text-primary">
                      Periode {index + 1}
                    </Text>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      Velg datoer og eventuelle klokkeslett for fraværet.
                    </Text>
                  </div>
                  {formData.ranges.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ranges: prev.ranges.filter((r) => r.id !== range.id) }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
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
                        'h-11 w-full justify-between bg-background text-text-primary',
                        !range.dateRange?.from && 'text-text-secondary',
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
                      onSelect={(nextRange) => {
                        setFormData((prev) => ({
                          ranges: prev.ranges.map((r) =>
                            r.id === range.id
                              ? { ...r, dateRange: (nextRange as UnavailabilityDateRange) ?? undefined }
                              : r,
                          ),
                        }));
                      }}
                      hidden={{ before: today }}
                      numberOfMonths={1}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                {rangeErrors.dateRange ? (
                  <p className="mt-1.5 text-xs text-destructive">{rangeErrors.dateRange}</p>
                ) : null}

                {isSingleDay ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <StartEndTimeSelector
                        startName={`range-${range.id}-startTime`}
                        endName={`range-${range.id}-endTime`}
                        startValue={range.startTime || '00:00'}
                        endValue={range.endTime || '23:59'}
                        startPlaceholder="Velg starttid"
                        endPlaceholder="Velg sluttid"
                        zIndex={60}
                        onStartChange={(nextValue) => {
                          setFormData((prev) => ({
                            ranges: prev.ranges.map((r) => (r.id === range.id ? { ...r, startTime: nextValue } : r)),
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            [range.id]: { ...(prev[range.id] || {}), startTime: undefined },
                          }));
                          setFormError(null);
                        }}
                        onEndChange={(nextValue) => {
                          setFormData((prev) => ({
                            ranges: prev.ranges.map((r) => (r.id === range.id ? { ...r, endTime: nextValue } : r)),
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            [range.id]: { ...(prev[range.id] || {}), endTime: undefined },
                          }));
                          setFormError(null);
                        }}
                      />
                      {rangeErrors.startTime ? (
                        <p className="text-xs text-destructive">{rangeErrors.startTime}</p>
                      ) : null}
                      {rangeErrors.endTime ? <p className="text-xs text-destructive">{rangeErrors.endTime}</p> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() => setFormData((prev) => ({ ranges: [...prev.ranges, createEmptyRange()] }))}
        >
          Legg til periode
        </Button>
      </form>
    </CompanyFormPageTemplate>
  );
}
