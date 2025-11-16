import * as React from 'react';
import { Button } from '@/components/ui/button';
import type { ScheduleDto, ScheduleTimeSlot } from 'tmp/openapi/gen/booking';

export type TimeSlotPickerProps = {
  schedule: ScheduleDto;
  selectedTimeSlot?: string | null; // format: ISO datetime e.g. "2025-11-16T09:00:00"
  onChange?: (value: string) => void;
  /**
   * Optional external predicate to disable a slot.
   * If provided, it's ANDed with built-in "past slot" check.
   */
  isSlotAllowed?: (slot: ScheduleTimeSlot) => boolean;
};

export default function TimeSlotPicker({ schedule, selectedTimeSlot, onChange, isSlotAllowed }: TimeSlotPickerProps) {
  const [value, setValue] = React.useState<string | null | undefined>(selectedTimeSlot);

  // keep internal in sync with parent
  React.useEffect(() => {
    setValue(selectedTimeSlot);
  }, [selectedTimeSlot]);

  const slots = schedule?.timeSlots ?? [];

  const handlePick = (startDateTime: string) => {
    setValue(startDateTime);
    onChange?.(startDateTime);
  };

  return (
    <div className="relative w-full max-w-lg">
      {/* subtle aurora / glow background that respects your theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-md bg-[radial-gradient(circle_at_top,_var(--ring)_0,_transparent_55%)] opacity-60 animate-aurora"
      />

      <div className="relative flex flex-col gap-4 p-4 rounded-md bg-card/80 border border-border shadow-md backdrop-blur">
        <div id="time-slot" role="listbox" aria-label="Tilgjengelige tidspunkt" className="mt-1">
          {slots.length === 0 ? (
            <div className="text-sm text-muted-foreground">Ingen ledige timer denne dagen.</div>
          ) : (
            <div className="flex flex-wrap gap-2 h-64 overflow-y-auto p-2 rounded-md bg-muted/40 border border-border/60">
              {slots.map((slot) => {
                const startDateTime = slot.startTime; // LocalDateTime string
                const endDateTime = slot.endTime; // LocalDateTime string
                const selected = startDateTime === value;

                const disabledBecausePast = isPastSlot(endDateTime);
                const externallyBlocked = isSlotAllowed ? !isSlotAllowed(slot) : false;
                const disabled = disabledBecausePast || externallyBlocked;

                return (
                  <Button
                    key={startDateTime}
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    className={[
                      'justify-center px-3 py-2 rounded-xl',
                      'transition-all duration-200',
                      'w-[calc(50%-0.25rem)]',
                      'sm:w-[calc(33.333%-0.5rem)]',
                      'md:w-[calc(25%-0.5rem)]',
                      'lg:w-[calc(20%-0.5rem)]',
                      selected
                        ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-1 ring-offset-background hover:bg-primary/90'
                        : 'bg-card text-foreground border-border hover:bg-accent/40 hover:border-primary/40',
                      disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-card' : 'hover:scale-[1.03]',
                    ].join(' ')}
                    aria-pressed={selected}
                    aria-selected={selected}
                    role="option"
                    disabled={disabled}
                    onClick={() => handlePick(startDateTime)}
                    title={`${formatTimeOnly(startDateTime)}–${formatTimeOnly(endDateTime)}`}
                  >
                    <span className="tabular-nums font-medium">{formatTimeOnly(startDateTime)}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {slots.length} ledige
          </span>
        </div>
      </div>
    </div>
  );
}

/** Extract and format time (HH:mm) from LocalDateTime string */
function formatTimeOnly(localDateTime: string): string {
  // Parse ISO 8601 LocalDateTime: "2025-11-16T09:00:00" or "2025-11-16T09:00:00.123"
  const date = new Date(localDateTime);
  return date.toLocaleTimeString('no-NO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Check if a slot's end time is in the past */
function isPastSlot(endDateTime: string): boolean {
  const end = new Date(endDateTime);
  return end.getTime() < Date.now();
}
