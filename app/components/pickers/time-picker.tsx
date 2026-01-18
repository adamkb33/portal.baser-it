import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '~/components/ui/button';
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

export function TimePicker({
  value,
  placeholder,
  isOpen,
  onOpenChange,
  onChange,
  startHour = 8,
  minuteStep = 5,
  zIndex = 60,
}: TimePickerProps) {
  const normalized = normalizeTimeValue(value);
  const [selectedHour, selectedMinute] = normalized ? normalized.split(':') : ['00', '00'];
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hourListRef = useRef<HTMLDivElement | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);
  const panelWidth = 240;

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), []);

  const minuteOptions = useMemo(() => {
    const steps = Math.max(1, Math.floor(60 / minuteStep));
    return Array.from({ length: steps }, (_, index) => String(index * minuteStep).padStart(2, '0'));
  }, [minuteStep]);

  const updatePanelPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - panelWidth - 8);
    const nextLeft = Math.min(rect.left, maxLeft);
    const nextTop = rect.bottom + 8;
    setPanelPosition((prev) => {
      if (prev && prev.top === nextTop && prev.left === nextLeft) return prev;
      return { top: nextTop, left: nextLeft };
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();

    const handleReposition = (event: Event) => {
      const target = event.target as Node | null;
      if (target && panelRef.current?.contains(target)) {
        return;
      }
      updatePanelPosition();
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [isOpen, onOpenChange]);

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

  const panel =
    isOpen && panelPosition
      ? createPortal(
          <div
            ref={panelRef}
            data-time-picker-panel
            className="fixed mt-2 w-[240px] rounded-md border border-card-border bg-card p-2 shadow-lg"
            style={{ top: panelPosition.top, left: panelPosition.left, zIndex }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <p className="text-xs text-form-text-muted">Timer</p>
              <div
                ref={hourListRef}
                className="h-40 overflow-y-scroll overscroll-contain rounded-md border border-form-border bg-form-bg p-1 touch-pan-y pointer-events-auto"
                style={{ WebkitOverflowScrolling: 'touch' }}
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
              >
                  {hourOptions.map((hour) => {
                    const selected = selectedHour === hour;
                    return (
                      <button
                        key={hour}
                        type="button"
                        data-hour={hour}
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
                className="h-40 overflow-y-scroll overscroll-contain rounded-md border border-form-border bg-form-bg p-1 touch-pan-y pointer-events-auto"
                style={{ WebkitOverflowScrolling: 'touch' }}
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(!isOpen)}
        ref={triggerRef}
        className={cn(
          'w-full h-11 justify-between bg-form-bg border-form-border text-form-text',
          !value && 'text-form-text-muted',
        )}
      >
        <span className="text-sm">{normalized || placeholder}</span>
        <span className="text-xs text-muted-foreground">24t</span>
      </Button>
      {panel}
    </div>
  );
}
