import { data, redirect } from 'react-router';
import type { Route } from './+types/company.booking.profile.schedule-unavailability.create.route';
import { useState } from 'react';
import { useSubmit } from 'react-router';
import { addMinutes, format, isSameDay, startOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { CompanyUserScheduleUnavailabilityController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { formatLocalDateTimeInTimeZone } from '~/lib/query';
import { ROUTES_MAP } from '~/lib/route-tree';
import {
  ScheduleUnavailabilityFormPage,
  createEmptyRange,
  emptyFormData,
  type UnavailabilityFormData,
  type UnavailabilityRangeFormData,
} from '../_components/schedule-unavailability-form-page';

export async function loader() {
  return data({});
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
      await CompanyUserScheduleUnavailabilityController.companyUserCreateUnavailabilityRanges({
        body: payload,
      });
    });

    return redirect(ROUTES_MAP['company.booking.profile.schedule-unavailability'].href);
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke lagre fravær');
    return data({ error: message }, { status: status ?? 400 });
  }
}

export default function CompanyBookingProfileScheduleUnavailabilityCreatePage({
  actionData,
}: Route.ComponentProps) {
  const submit = useSubmit();
  const [formData, setFormData] = useState<UnavailabilityFormData>(emptyFormData);
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
    <ScheduleUnavailabilityFormPage
      formData={formData}
      formErrors={formErrors}
      formError={formError}
      actionError={actionData?.error ?? null}
      onSubmit={handleSubmit}
      onFieldChange={(rangeId, field, value) => {
        setFormData((prev) => ({
          ranges: prev.ranges.map((range) => (range.id === rangeId ? { ...range, [field]: value } : range)),
        }));
        setFormErrors((prev) => ({
          ...prev,
          [rangeId]: { ...(prev[rangeId] || {}), [field]: undefined },
        }));
        setFormError(null);
      }}
      onRemoveRange={(rangeId) => {
        setFormData((prev) => ({
          ranges: prev.ranges.filter((range) => range.id !== rangeId),
        }));
      }}
      onAddRange={() => {
        setFormData((prev) => ({
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
  );
}
