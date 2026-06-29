import { useState } from 'react';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '~/ui';
import { formatDateValue, parseDateValue } from '../_utils/company.offer.create.utils';

export function OfferDatePicker({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);

  return (
    <label className="grid w-fit gap-1 text-sm text-text-primary">
      <span className="font-medium">{label}</span>
      <input type="hidden" name={name} value={value} required={required} />
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="h-10 w-max max-w-full justify-between text-left text-sm">
              <span className={!value ? 'text-text-secondary' : undefined}>{value || 'Velg dato'}</span>
              <CalendarIcon className="h-4 w-4 text-text-secondary" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden border-border bg-overlay-surface p-0 text-text-primary"
            align="start"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(nextDate) => {
                if (nextDate) {
                  setValue(formatDateValue(nextDate));
                }
                setOpen(false);
              }}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10"
            aria-label="Fjern dato"
            onClick={(event) => {
              event.stopPropagation();
              setValue('');
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </label>
  );
}
