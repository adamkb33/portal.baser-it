import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ScheduleDto, ScheduleTimeSlot } from 'tmp/openapi/gen/booking';

export type TimeSlotPickerProps = {
  schedule: ScheduleDto;
  selectedTimeSlot?: string; // format: `${startTime}-${endTime}` e.g. "09:00-09:30"
  onChange?: (value: string) => void;
  /**
   * Optional external predicate to disable a slot.
   * If provided, it's ANDed with built-in "past slot" check.
   */
  isSlotAllowed?: (slot: ScheduleTimeSlot) => boolean;
};

export default function TimeSlotPicker({ schedule, selectedTimeSlot, onChange, isSlotAllowed }: TimeSlotPickerProps) {
  const [value, setValue] = React.useState<string | undefined>(selectedTimeSlot);

  // keep internal in sync with parent
  React.useEffect(() => {
    setValue(selectedTimeSlot);
  }, [selectedTimeSlot]);

  const slots = schedule?.timeSlots ?? [];

  const handlePick = (key: string) => {
    setValue(key);
    onChange?.(key);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <Label htmlFor="time-slot">Velg tidspunkt</Label>

      <div id="time-slot" role="listbox" aria-label="Tilgjengelige tidspunkt">
        {slots.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ingen ledige timer denne dagen.</div>
        ) : (
          <div className="flex flex-wrap gap-2 h-64 overflow-scroll p-2 border">
            {slots.map((slot) => {
              const key = toKey(slot);
              const selected = key === value;

              const disabledBecausePast = isPastSlot(schedule.date, slot.endTime);
              const externallyBlocked = isSlotAllowed ? !isSlotAllowed(slot) : false;
              const disabled = disabledBecausePast || externallyBlocked;

              return (
                <Button
                  key={key}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  className={[
                    // responsive widths using flex as requested
                    'justify-center',
                    'px-3 py-2',
                    'rounded-xl',
                    'transition',
                    'w-[calc(50%-0.25rem)]',
                    'sm:w-[calc(33.333%-0.5rem)]',
                    'md:w-[calc(25%-0.5rem)]',
                    'lg:w-[calc(20%-0.5rem)]',
                  ].join(' ')}
                  aria-pressed={selected}
                  aria-selected={selected}
                  role="option"
                  disabled={disabled}
                  onClick={() => handlePick(key)}
                  title={`${formatTime(schedule.date, slot.startTime)}–${formatTime(schedule.date, slot.endTime)}`}
                >
                  <span className="tabular-nums">{formatTime(schedule.date, slot.startTime)}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** key format used for URL/state */
function toKey(slot: ScheduleTimeSlot) {
  return `${slot.startTime}-${slot.endTime}`;
}

/** locale-friendly HH:mm from date+time */
function formatTime(isoDate: string, time: string) {
  // assume "HH:mm" from API; combine with date for formatting
  const d = new Date(`${isoDate}T${padTime(time)}:00`);
  return d.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
}

/** consider a slot disabled if its END is in the past (client clock) */
function isPastSlot(isoDate: string, endTime: string) {
  const end = new Date(`${isoDate}T${padTime(endTime)}:00`);
  return end.getTime() < Date.now();
}

/** normalize "H:mm" -> "HH:mm" just in case */
function padTime(t: string) {
  const [h = '0', m = '0'] = t.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}
