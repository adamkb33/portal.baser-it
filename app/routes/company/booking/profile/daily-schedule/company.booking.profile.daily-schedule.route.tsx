import { data, redirect, useLoaderData, useSubmit } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import type { DailyScheduleDto } from 'tmp/openapi/gen/booking';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/table/data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';

import {
  dailyScheduleAction,
  type BookingDailyScheduleLoaderArgs,
} from '../../../../company/booking/profile/daily-schedule/_features/daily-schedule.feature';
import { createBookingClient } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from '~/lib/auth.utils';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithInfo } from '~/routes/company/_lib/flash-message.server';
import type { Route } from './+types/company.booking.profile.daily-schedule.route';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const accessToken = await getAccessTokenFromRequest(request);
    if (!accessToken) {
      return redirect('/');
    }

    const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
    const response =
      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.getDailySchedules();

    if (!response.data) {
      return data({ dailySchedules: [] });
    }

    return data({ dailySchedules: response.data });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      if (error.body?.message === 'Profil ikke funnet') {
        return redirectWithInfo(
          request,
          ROUTES_MAP['company.booking.profile'].href,
          `Vennligst opprett en bookingprofil før du administrerer arbeidstider.`,
        );
      }

      return { error: error.body.message };
    }

    throw error;
  }
}

export const action = dailyScheduleAction;

const DAY_LABELS: Record<DailyScheduleDto['dayOfWeek'], string> = {
  MONDAY: 'Mandag',
  TUESDAY: 'Tirsdag',
  WEDNESDAY: 'Onsdag',
  THURSDAY: 'Torsdag',
  FRIDAY: 'Fredag',
  SATURDAY: 'Lørdag',
  SUNDAY: 'Søndag',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

type FormData = {
  id?: number | null;
  dayOfWeek: DailyScheduleDto['dayOfWeek'];
  startTime: string;
  endTime: string;
};

export default function BookingCompanyUserDailySchedule() {
  const { dailySchedules } = useLoaderData<BookingDailyScheduleLoaderArgs>();
  const submit = useSubmit();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDefaultDialogOpen, setIsDefaultDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FormData | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);
  const [defaultSchedule, setDefaultSchedule] = useState({
    startTime: '09:00',
    endTime: '17:00',
    selectedDays: [] as string[],
  });

  const sortedSchedules = [...dailySchedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  const existingDays = new Set(dailySchedules.map((s) => s.dayOfWeek));
  const missingDays = DAY_ORDER.filter((day) => !existingDays.has(day as DailyScheduleDto['dayOfWeek']));

  const handleCreateDefaultSchedule = () => {
    setDefaultSchedule({
      startTime: '09:00',
      endTime: '17:00',
      selectedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    });
    setIsDefaultDialogOpen(true);
  };

  const handleDefaultScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (defaultSchedule.selectedDays.length === 0) {
      toast.error('Velg minst én dag');
      return;
    }

    const formData = new FormData();
    formData.append('intent', 'create-bulk');
    formData.append('startTime', defaultSchedule.startTime);
    formData.append('endTime', defaultSchedule.endTime);
    formData.append('days', defaultSchedule.selectedDays.join(','));

    submit(formData, { method: 'post' });
    toast.success('Standard arbeidstider lagret');

    setIsDefaultDialogOpen(false);
  };

  const toggleDay = (day: string) => {
    setDefaultSchedule((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
  };

  const handleEdit = (schedule: DailyScheduleDto) => {
    setEditingSchedule({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.substring(0, 5),
      endTime: schedule.endTime.substring(0, 5),
    });
    setIsDialogOpen(true);
  };

  const handleAddDay = (day: string) => {
    setEditingSchedule({
      id: null,
      dayOfWeek: day as DailyScheduleDto['dayOfWeek'],
      startTime: '09:00',
      endTime: '17:00',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingScheduleId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingScheduleId) return;

    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', String(deletingScheduleId));

    submit(formData, { method: 'post' });
    toast.success('Arbeidstid fjernet');

    setIsDeleteDialogOpen(false);
    setDeletingScheduleId(null);
  };

  const handleFieldChange = (name: keyof FormData, value: any) => {
    if (editingSchedule) setEditingSchedule({ ...editingSchedule, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    const fd = new FormData();
    fd.append('intent', editingSchedule.id ? 'update' : 'create');
    if (editingSchedule.id) fd.append('id', String(editingSchedule.id));
    fd.append('dayOfWeek', editingSchedule.dayOfWeek);
    fd.append('startTime', editingSchedule.startTime);
    fd.append('endTime', editingSchedule.endTime);

    submit(fd, { method: 'post' });

    setIsDialogOpen(false);
    setEditingSchedule(null);

    toast.success(editingSchedule.id ? 'Arbeidstid oppdatert' : 'Arbeidstid lagret');
  };

  return (
    <div className="space-y-5">
      <div className="border border-border bg-background p-4 sm:p-5">
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Planlegging</span>
            <h1 className="mt-1 text-base font-semibold text-foreground">Arbeidstider</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Velg hvilke dager og klokkeslett du er tilgjengelig for avtaler.
          </p>

          {sortedSchedules.length === 0 && (
            <button
              onClick={handleCreateDefaultSchedule}
              className="border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
            >
              Sett standard arbeidstider
            </button>
          )}
        </div>
      </div>

      <div className="border border-border bg-background p-4 sm:p-5">
        {sortedSchedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Du har ikke lagt inn noen arbeidstider ennå. Du kan starte med standard arbeidstider eller legge inn dagene
            manuelt.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Mobile: Stacked cards */}
            <div className="space-y-2 sm:hidden">
              {sortedSchedules.map((schedule) => (
                <div key={schedule.id} className="border border-border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{DAY_LABELS[schedule.dayOfWeek]}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="border border-border bg-background text-foreground px-2 py-1 text-[0.7rem] font-medium rounded-none"
                      >
                        Rediger
                      </button>
                      <button
                        onClick={() => handleDeleteClick(schedule.id)}
                        className="border border-border bg-background text-foreground px-2 py-1 text-[0.7rem] font-medium rounded-none"
                      >
                        Slett
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Start: {schedule.startTime.substring(0, 5)}</span>
                    <span>Slutt: {schedule.endTime.substring(0, 5)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block">
              <DataTable<DailyScheduleDto>
                data={sortedSchedules}
                getRowKey={(schedule) => schedule.id}
                columns={[
                  {
                    header: 'Ukedag',
                    accessor: (schedule) => DAY_LABELS[schedule.dayOfWeek],
                    className: 'font-medium',
                  },
                  { header: 'Start', accessor: (s) => s.startTime.substring(0, 5) },
                  { header: 'Slutt', accessor: (s) => s.endTime.substring(0, 5) },
                ]}
                actions={[
                  { label: 'Rediger', onClick: (schedule) => handleEdit(schedule), variant: 'outline' },
                  { label: 'Slett', onClick: (schedule) => handleDeleteClick(schedule.id), variant: 'destructive' },
                ]}
              />
            </div>

            {missingDays.length > 0 && (
              <div className="border-t border-border pt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Dager uten arbeidstid
                  </p>
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">
                    Klikk på en dag for å legge til arbeidstid.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {missingDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleAddDay(day)}
                      className="border border-border bg-background text-foreground px-2.5 py-1.5 text-xs font-medium rounded-none"
                    >
                      + {DAY_LABELS[day as DailyScheduleDto['dayOfWeek']]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editingSchedule && (
        <FormDialog<FormData>
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={editingSchedule.id ? 'Rediger arbeidstid' : 'Legg til arbeidstid'}
          formData={editingSchedule}
          onFieldChange={handleFieldChange}
          onSubmit={handleSubmit}
          fields={[
            {
              name: 'dayOfWeek',
              label: 'Ukedag',
              type: 'select',
              disabled: true,
              options: DAY_ORDER.map((day) => ({
                label: DAY_LABELS[day as DailyScheduleDto['dayOfWeek']],
                value: day,
              })),
            },
            { name: 'startTime', label: 'Start', type: 'time', required: true },
            { name: 'endTime', label: 'Slutt', type: 'time', required: true },
          ]}
          actions={[
            {
              label: 'Avbryt',
              variant: 'outline',
              onClick: () => {
                setIsDialogOpen(false);
                setEditingSchedule(null);
              },
            },
            { label: 'Lagre', type: 'submit', variant: 'default' },
          ]}
        />
      )}

      {/* Default Schedule Dialog */}
      {isDefaultDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80">
          <div className="w-full max-w-md border border-border bg-background p-4 sm:p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Sett standard arbeidstider</h2>
              <p className="mt-1 text-xs text-muted-foreground">Velg tidspunkt og hvilke dager du vil jobbe.</p>
            </div>

            <form onSubmit={handleDefaultScheduleSubmit} className="space-y-4">
              {/* Time inputs */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Fra</label>
                    <input
                      type="time"
                      value={defaultSchedule.startTime}
                      onChange={(e) => setDefaultSchedule((prev) => ({ ...prev, startTime: e.target.value }))}
                      className="w-full border border-border bg-background text-foreground px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Til</label>
                    <input
                      type="time"
                      value={defaultSchedule.endTime}
                      onChange={(e) => setDefaultSchedule((prev) => ({ ...prev, endTime: e.target.value }))}
                      className="w-full border border-border bg-background text-foreground px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Day selection */}
              <div className="border-t border-border pt-4 space-y-3">
                <label className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Velg dager
                </label>
                <div className="space-y-2">
                  {DAY_ORDER.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-full border border-border px-3 py-2 text-sm font-medium rounded-none text-left ${
                        defaultSchedule.selectedDays.includes(day)
                          ? 'bg-primary text-background'
                          : 'bg-background text-foreground'
                      }`}
                    >
                      {DAY_LABELS[day as DailyScheduleDto['dayOfWeek']]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDefaultDialogOpen(false)}
                  className="flex-1 border border-border bg-background text-foreground px-3 py-2 text-xs font-medium rounded-none"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
                >
                  Lagre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        description="Er du sikker på at du vil fjerne denne arbeidstiden? Denne handlingen kan ikke angres."
      />
    </div>
  );
}
