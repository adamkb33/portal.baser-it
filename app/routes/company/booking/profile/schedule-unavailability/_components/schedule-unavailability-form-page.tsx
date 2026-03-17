import type React from 'react';
import { useNavigate, useNavigation } from 'react-router';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format, isSameDay, startOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { TimePicker } from '~/components/pickers/time-picker';
import { ROUTES_MAP } from '~/lib/route-tree';
import { cn } from '~/lib/utils';
import {
  Button,
  Calendar,
  CompanyFormPageTemplate,
  Notice,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '~/ui';

export type UnavailabilityRangeFormData = {
  id: string;
  dateRange: DateRange | undefined;
  startTime: string;
  endTime: string;
};

export type UnavailabilityFormData = {
  ranges: UnavailabilityRangeFormData[];
};

export const createEmptyRange = (): UnavailabilityRangeFormData => {
  const today = startOfDay(new Date());
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    dateRange: { from: today, to: today },
    startTime: '',
    endTime: '',
  };
};

export const emptyFormData: UnavailabilityFormData = {
  ranges: [createEmptyRange()],
};

type TimePickerState = {
  rangeId: string;
  field: 'startTime' | 'endTime';
} | null;

type ScheduleUnavailabilityFormPageProps = {
  formData: UnavailabilityFormData;
  formErrors: Record<string, Partial<Record<'dateRange' | 'startTime' | 'endTime', string>>>;
  formError: string | null;
  actionError?: string | null;
  onSubmit: (event: React.FormEvent) => void;
  onFieldChange: (rangeId: string, field: keyof UnavailabilityRangeFormData, value: unknown) => void;
  onRemoveRange: (rangeId: string) => void;
  onAddRange: () => void;
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: (open: boolean) => void;
  activeRangeId: string | null;
  setActiveRangeId: (rangeId: string | null) => void;
  isTimePickerOpen: boolean;
  setIsTimePickerOpen: (open: boolean) => void;
  activeTimePicker: TimePickerState;
  setActiveTimePicker: (next: TimePickerState) => void;
  today: Date;
};

export function ScheduleUnavailabilityFormPage({
  formData,
  formErrors,
  formError,
  actionError,
  onSubmit,
  onFieldChange,
  onRemoveRange,
  onAddRange,
  isDatePickerOpen,
  setIsDatePickerOpen,
  activeRangeId,
  setActiveRangeId,
  isTimePickerOpen,
  setIsTimePickerOpen,
  activeTimePicker,
  setActiveTimePicker,
  today,
}: ScheduleUnavailabilityFormPageProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <CompanyFormPageTemplate
      title="Legg til fravær"
      description="Planlegg fravær som en egen ruteside i stedet for et overlegg. Hold oversikten ryddig og konsistent med resten av bookingprofilen."
      backLink={{
        to: ROUTES_MAP['company.booking.profile.schedule-unavailability'].href,
        label: 'Tilbake til fravær',
      }}
      notices={
        actionError || formError ? (
          <Notice tone="emphasis" title="Kunne ikke lagre fravær" message={actionError || formError || ''} />
        ) : null
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES_MAP['company.booking.profile.schedule-unavailability'].href)}
          >
            Avbryt
          </Button>
          <Button type="submit" form="schedule-unavailability-form" loading={isSubmitting}>
            Lagre fravær
          </Button>
        </>
      }
    >
      <form id="schedule-unavailability-form" onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-3">
          {formData.ranges.map((range, index) => {
            const rangeErrors = formErrors[range.id] || {};
            const isSingleDayRange =
              !!range.dateRange?.from &&
              !!range.dateRange?.to &&
              isSameDay(range.dateRange.from, range.dateRange.to);
            const label = range.dateRange?.from
              ? range.dateRange.to
                ? `${format(range.dateRange.from, 'dd.MM.yyyy')} – ${format(range.dateRange.to, 'dd.MM.yyyy')}`
                : format(range.dateRange.from, 'dd.MM.yyyy')
              : 'Velg periode';

            return (
              <div key={range.id} className="rounded-md border border-border bg-background p-3">
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveRange(range.id)}>
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
                      onSelect={(nextRange) => onFieldChange(range.id, 'dateRange', nextRange)}
                      hidden={{ before: today }}
                      numberOfMonths={1}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                {rangeErrors.dateRange ? <p className="mt-1.5 text-xs text-destructive">{rangeErrors.dateRange}</p> : null}

                {isSingleDayRange ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">Starttid</label>
                      <TimePicker
                        value={range.startTime || '00:00'}
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
                        onChange={(nextValue) => onFieldChange(range.id, 'startTime', nextValue)}
                        zIndex={60}
                      />
                      {rangeErrors.startTime ? <p className="text-xs text-destructive">{rangeErrors.startTime}</p> : null}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">Sluttid</label>
                      <TimePicker
                        value={range.endTime || '23:59'}
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
                        onChange={(nextValue) => onFieldChange(range.id, 'endTime', nextValue)}
                        zIndex={60}
                      />
                      {rangeErrors.endTime ? <p className="text-xs text-destructive">{rangeErrors.endTime}</p> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <Button type="button" variant="outline" className="h-11 w-full" onClick={onAddRange}>
          Legg til periode
        </Button>
      </form>
    </CompanyFormPageTemplate>
  );
}
