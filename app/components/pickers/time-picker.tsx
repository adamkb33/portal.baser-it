import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { Button } from '~/ui';
import { cn } from '~/lib/utils';

type TimePickerProps = {
  value: string;
  placeholder: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (nextValue: string) => void;
  startHour?: number;
  minuteStep?: number;
  zIndex?: number;
  disabled?: boolean;
  className?: string;
  minValue?: string;
  maxValue?: string;
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

const toMinutes = (value: string) => {
  const normalized = normalizeTimeValue(value);
  if (!normalized) return null;
  const [hourRaw = '00', minuteRaw = '00'] = normalized.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

export function TimePicker({
  value,
  placeholder,
  isOpen,
  onOpenChange,
  onChange,
  startHour = 8,
  minuteStep = 5,
  zIndex = 60,
  disabled = false,
  className,
  minValue,
  maxValue,
}: TimePickerProps) {
  const normalized = normalizeTimeValue(value);
  const [selectedHour, selectedMinute] = normalized ? normalized.split(':') : ['00', '00'];
  const [pendingHour, setPendingHour] = useState<string>(selectedHour);
  const [pendingMinute, setPendingMinute] = useState<string>(selectedMinute);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hourListRef = useRef<HTMLDivElement | null>(null);

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), []);

  const minuteOptions = useMemo(() => {
    const steps = Math.max(1, Math.floor(60 / minuteStep));
    return Array.from({ length: steps }, (_, index) => String(index * minuteStep).padStart(2, '0'));
  }, [minuteStep]);

  useEffect(() => {
    if (!isOpen) return;
    setPendingHour(selectedHour);
    setPendingMinute(selectedMinute);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const targetHour = value ? selectedHour : String(startHour).padStart(2, '0');
    requestAnimationFrame(() => {
      const container = hourListRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLButtonElement>(`[data-hour="${targetHour}"]`);
      if (!target) return;
      const nextTop = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
      container.scrollTop = Math.max(0, nextTop);
    });
  }, [isOpen, selectedHour, startHour, value]);

  const pendingValue = buildTimeValue(value || '00:00', pendingHour, pendingMinute);
  const minMinutes = minValue ? toMinutes(minValue) : null;
  const maxMinutes = maxValue ? toMinutes(maxValue) : null;

  const panel = isOpen ? (
    <div
      data-time-picker-panel
      className="absolute left-0 top-full z-[60] mt-1.5 w-[214px] rounded-md border border-border bg-overlay-surface p-0 shadow-lg"
      style={{ zIndex }}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Velg tid</p>
        <div className="mt-0.5 text-sm font-semibold text-text-primary">{pendingValue || '--:--'}</div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2">
        <div>
          <div
            ref={hourListRef}
            className="h-28 overflow-y-auto overscroll-contain rounded-sm border border-border bg-background p-1 touch-pan-y pointer-events-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            {hourOptions.map((hour, index) => {
              const hourMinute = Number(hour) * 60;
              const isHourUnavailable =
                (minMinutes != null && hourMinute + 59 < minMinutes) ||
                (maxMinutes != null && hourMinute > maxMinutes);
              return (
                <button
                  key={hour}
                  type="button"
                  data-hour={hour}
                  disabled={isHourUnavailable}
                  className={cn(
                    'w-full rounded-sm px-1.5 py-1 text-left text-xs transition-colors hover:bg-surface-primary-subtle hover:text-primary',
                    index % 2 === 0 ? 'bg-surface/60' : 'bg-transparent',
                    pendingHour === hour && 'bg-surface-primary-subtle text-primary font-semibold',
                    isHourUnavailable && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-text-secondary',
                  )}
                  onClick={() => !isHourUnavailable && setPendingHour(hour)}
                >
                  {hour}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div
            className="h-28 overflow-y-auto overscroll-contain rounded-sm border border-border bg-background p-1 touch-pan-y pointer-events-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            {minuteOptions.map((minute, index) => {
              const minuteValue = Number(minute);
              const combinedMinutes = Number(pendingHour) * 60 + minuteValue;
              const isMinuteUnavailable =
                (minMinutes != null && combinedMinutes < minMinutes) ||
                (maxMinutes != null && combinedMinutes > maxMinutes);
              return (
                <button
                  key={minute}
                  type="button"
                  disabled={isMinuteUnavailable}
                  className={cn(
                    'w-full rounded-sm px-1.5 py-1 text-left text-xs transition-colors hover:bg-surface-primary-subtle hover:text-primary',
                    index % 2 === 0 ? 'bg-surface/60' : 'bg-transparent',
                    pendingMinute === minute && 'bg-surface-primary-subtle text-primary font-semibold',
                    isMinuteUnavailable && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-text-secondary',
                  )}
                  onClick={() => !isMinuteUnavailable && setPendingMinute(minute)}
                >
                  {minute}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 border-t border-border px-2 py-2">
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onOpenChange(false)}>
          Avbryt
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            onChange(pendingValue);
            onOpenChange(false);
          }}
        >
          OK
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && onOpenChange(!isOpen)}
        ref={triggerRef}
        disabled={disabled}
        className={cn(
          'h-9 w-full justify-between gap-2 rounded-sm border border-border bg-background px-2 text-text-primary shadow-none',
          'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]',
          isOpen && 'border-ring ring-2 ring-ring/40',
          !value && 'text-text-secondary',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      >
        <span className="text-xs">{normalized || placeholder}</span>
        <Clock3 className="size-3.5 text-text-secondary" />
      </Button>
      {panel}
    </div>
  );
}
