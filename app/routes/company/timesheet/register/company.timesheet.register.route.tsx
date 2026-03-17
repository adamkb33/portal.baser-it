import * as React from 'react';
import { data, Link, useNavigation, useSubmit } from 'react-router';
import type { Route } from './+types/company.timesheet.register.route';
import { CompanyUserTimesheetEntryController } from '~/api/generated/timesheet';
import { withAuth } from '~/api/utils/with-auth';
import { TimePicker } from '~/components/pickers/time-picker';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithSuccess, setFlashMessage } from '~/routes/company/_lib/flash-message.server';
import {
  Button,
  Calendar,
  CompanyPageTemplate,
  Input,
  Notice,
  Panel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '~/ui';
import { formatDateInputToZonedISOString, normalizeNote, parseBulkEntries, splitBulkEntries } from '../_utils';

type EntryMode = 'hours' | 'range';

type RegisterEntry = {
  id: string;
  mode: EntryMode;
  date: string;
  hours: string;
  fromTime: string;
  toTime: string;
};

type RegisterFormData = {
  mode: EntryMode;
  note: string;
  entries: RegisterEntry[];
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const note = normalizeNote(formData.get('note'));
  const { error, entries } = parseBulkEntries(formData.get('entries'));

  if (error) {
    const flashCookie = await setFlashMessage(request, { type: 'error', text: error });
    return data({ ok: false, error }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  const { rangeEntries, hoursEntries } = splitBulkEntries(entries);
  if (!rangeEntries.length && !hoursEntries.length) {
    const errorMessage = 'Legg til minst én gyldig registrering før du lagrer.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: errorMessage });
    return data({ ok: false, error: errorMessage }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  const hasDisallowedDate = entries.some((entry) => !isEntryDateAllowed(parseDateInput(entry.date)));
  if (hasDisallowedDate) {
    const errorMessage = 'Du kan bare registrere timer fra i dag og opptil tre uker frem i tid.';
    const flashCookie = await setFlashMessage(request, { type: 'error', text: errorMessage });
    return data({ ok: false, error: errorMessage }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }

  try {
    if (rangeEntries.length) {
      await withAuth(request, () =>
        CompanyUserTimesheetEntryController.createRangeEntries({
          body: {
            note,
            days: rangeEntries.map((entry) => ({
              date: formatDateInputToZonedISOString(entry.date),
              fromTime: entry.fromTime!,
              toTime: entry.toTime!,
            })),
          },
        }),
      );
    }

    if (hoursEntries.length) {
      await withAuth(request, () =>
        CompanyUserTimesheetEntryController.createHoursEntries({
          body: {
            note,
            days: hoursEntries.map((entry) => ({
              date: formatDateInputToZonedISOString(entry.date),
              hours: Number(entry.hours),
            })),
          },
        }),
      );
    }

    return redirectWithSuccess(request, ROUTES_MAP['company.timesheet'].href, 'Registrering lagret');
  } catch (err) {
    const { message } = resolveErrorPayload(err, 'Kunne ikke lagre registreringene');
    const flashCookie = await setFlashMessage(request, { type: 'error', text: message });
    return data({ ok: false, error: message }, { status: 400, headers: { 'Set-Cookie': flashCookie } });
  }
}

export default function CompanyTimeSheetsRegisterRoute({ actionData }: Route.ComponentProps) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [openDateEntryId, setOpenDateEntryId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<RegisterFormData>({
    mode: 'hours',
    note: '',
    entries: [createEntry('hours')],
  });

  const updateEntry = (id: string, patch: Partial<RegisterEntry>) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  };

  const removeEntry = (id: string) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id),
    }));
  };

  const addEntry = (mode: EntryMode) => {
    setForm((prev) => ({
      ...prev,
      entries: [...prev.entries, createEntry(mode)],
    }));
  };

  const visibleEntries = form.entries.filter((entry) => entry.mode === form.mode);

  return (
    <CompanyPageTemplate
      title="Ny registrering"
      description="Opprett timer eller tidsintervaller i samme kompakte formulamønster som resten av company-domenet."
      label="Timelister"
      actions={
        <Link
          to={ROUTES_MAP['company.timesheet'].href}
          className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
        >
          Avbryt
        </Link>
      }
    >
      {actionData?.ok === false && actionData.error ? (
        <Notice tone="emphasis" title="Kunne ikke lagre registreringen" message={actionData.error} />
      ) : null}

      <Panel title="Ny registrering" description="Legg inn en eller flere timer eller intervaller og send dem inn samlet.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData();
            formData.append('note', form.note);
            formData.append('entries', JSON.stringify(toBulkEntries(form.entries)));
            submit(formData, { method: 'post' });
          }}
          className="space-y-6"
        >
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-text-primary">Registreringstype</h2>
            <Tabs
              value={form.mode}
              onValueChange={(value) => setForm((prev) => ({ ...prev, mode: value as RegisterFormData['mode'] }))}
              className="w-full"
            >
              <TabsList className="w-full">
                <TabsTrigger value="hours" className="w-full">
                  Timer
                </TabsTrigger>
                <TabsTrigger value="range" className="w-full">
                  Intervall
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-text-primary">Notat</h2>
            <Textarea
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Valgfritt"
              className="min-h-24"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-text-primary">Registreringer</h2>
              <Button type="button" variant="secondary" onClick={() => addEntry(form.mode)}>
                Legg til registrering
              </Button>
            </div>

            <div className="space-y-3">
              {visibleEntries.map((entry) => (
                <div key={entry.id} className="flex flex-wrap gap-2 rounded-md border border-border bg-background p-3">
                  <div className="min-w-[220px] flex-1">
                    <Popover
                      open={openDateEntryId === entry.id}
                      onOpenChange={(open) => setOpenDateEntryId(open ? entry.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" type="button" className="h-10 w-full justify-start text-left text-sm">
                          {entry.date || 'Velg dato'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateInput(entry.date)}
                          onSelect={(nextDate) => {
                            if (nextDate) {
                              updateEntry(entry.id, { date: formatDateForInput(nextDate) });
                            }
                            setOpenDateEntryId(null);
                          }}
                          numberOfMonths={1}
                          hidden={{ before: getMinSelectableDate(), after: getMaxSelectableDate() }}
                          disabled={(date) => !isEntryDateAllowed(date)}
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex min-w-[220px] flex-1 items-center">
                    {entry.mode === 'hours' ? (
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="Timer"
                        value={entry.hours}
                        onChange={(event) => updateEntry(entry.id, { hours: event.target.value })}
                      />
                    ) : (
                      <RangeTimeInputs
                        entryId={entry.id}
                        fromTime={entry.fromTime}
                        toTime={entry.toTime}
                        onChange={updateEntry}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <Button type="button" variant="outline" onClick={() => removeEntry(entry.id)}>
                      Fjern
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Link
              to={ROUTES_MAP['company.timesheet'].href}
              className="inline-flex h-10 items-center justify-center rounded-sm border border-border bg-background px-4 text-base font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
            >
              Avbryt
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </Panel>
    </CompanyPageTemplate>
  );
}

function createEntry(mode: EntryMode): RegisterEntry {
  return {
    id: createEntryId(),
    mode,
    date: formatDateForInput(new Date()),
    hours: '',
    fromTime: '',
    toTime: '',
  };
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function createEntryId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toBulkEntries(entries: RegisterEntry[]) {
  return entries.map((entry) => ({
    date: entry.date,
    entryMode: entry.mode === 'hours' ? 'HOURS' : 'RANGE',
    hours: entry.hours ? Number(entry.hours) : undefined,
    fromTime: entry.fromTime || undefined,
    toTime: entry.toTime || undefined,
  }));
}

type RangeTimeInputsProps = {
  entryId: string;
  fromTime: string;
  toTime: string;
  onChange: (id: string, patch: Partial<RegisterEntry>) => void;
};

function RangeTimeInputs({ entryId, fromTime, toTime, onChange }: RangeTimeInputsProps) {
  const [activePicker, setActivePicker] = React.useState<'from' | 'to' | null>(null);

  return (
    <div className="flex w-full gap-2">
      <div className="flex-1">
        <TimePicker
          value={fromTime}
          placeholder="Fra"
          isOpen={activePicker === 'from'}
          onOpenChange={(open) => setActivePicker(open ? 'from' : null)}
          onChange={(next) => {
            onChange(entryId, { fromTime: next });
            setActivePicker(null);
          }}
          zIndex={80}
          className="w-full"
        />
      </div>
      <div className="flex-1">
        <TimePicker
          value={toTime}
          placeholder="Til"
          isOpen={activePicker === 'to'}
          onOpenChange={(open) => setActivePicker(open ? 'to' : null)}
          onChange={(next) => {
            onChange(entryId, { toTime: next });
            setActivePicker(null);
          }}
          zIndex={80}
          className="w-full"
        />
      </div>
    </div>
  );
}

function isEntryDateAllowed(date: Date | undefined) {
  if (!date) {
    return false;
  }

  const min = getMinSelectableDate();
  const max = getMaxSelectableDate();
  return date >= startOfDay(min) && date <= endOfDay(max);
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function getMinSelectableDate() {
  return startOfDay(new Date());
}

function getMaxSelectableDate() {
  const max = startOfDay(new Date());
  max.setDate(max.getDate() + 21);
  return max;
}
