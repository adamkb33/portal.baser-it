import { useEffect, useState } from 'react';
import { TimePicker } from '~/components/pickers/time-picker';

type StartEndTimeSelectorProps = {
  startName?: string;
  endName?: string;
  startValue: string;
  endValue: string;
  onStartChange: (next: string) => void;
  onEndChange: (next: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  zIndex?: number;
};

function toMinutes(value: string): number | null {
  if (!value) return null;
  const [hourRaw = '00', minuteRaw = '00'] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function StartEndTimeSelector({
  startName = 'startTime',
  endName = 'endTime',
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder = 'Starttid',
  endPlaceholder = 'Sluttid',
  zIndex = 60,
}: StartEndTimeSelectorProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  useEffect(() => {
    const startMinutes = toMinutes(startValue);
    const endMinutes = toMinutes(endValue);
    if (startMinutes == null || endMinutes == null) return;
    if (endMinutes < startMinutes) {
      onEndChange(startValue);
    }
  }, [startValue, endValue, onEndChange]);

  return (
    <>
      <div>
        <input type="hidden" name={startName} value={startValue} />
        <TimePicker
          value={startValue}
          placeholder={startPlaceholder}
          isOpen={isStartOpen}
          onOpenChange={(open) => {
            setIsStartOpen(open);
            if (open) setIsEndOpen(false);
          }}
          onChange={onStartChange}
          zIndex={zIndex}
        />
      </div>

      <div>
        <input type="hidden" name={endName} value={endValue} />
        <TimePicker
          value={endValue}
          placeholder={endPlaceholder}
          isOpen={isEndOpen}
          onOpenChange={(open) => {
            if (!startValue) return;
            setIsEndOpen(open);
            if (open) setIsStartOpen(false);
          }}
          onChange={onEndChange}
          minValue={startValue || undefined}
          zIndex={zIndex}
          disabled={!startValue}
        />
      </div>
    </>
  );
}

