import {
  data,
  redirect,
  useLoaderData,
  useSubmit,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import type { DailyScheduleDto } from 'tmp/openapi/gen/booking';
import { createBookingClient, DayOfWeek } from '~/api/clients/booking';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/table/data-table';
import { FormDialog } from '~/components/dialog/form-dialog';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';

export type BookingDailyScheduleLoaderArgs = {
  dailySchedules: DailyScheduleDto[];
};

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

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
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
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) {
    return redirect('/');
  }

  const bookingClient = createBookingClient({ baseUrl: ENV.BOOKING_BASE_URL, token: accessToken });
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  try {
    if (intent === 'create' || intent === 'update') {
      const id = formData.get('id') ? Number(formData.get('id')) : null;
      const dayOfWeek = formData.get('dayOfWeek') as DailyScheduleDto['dayOfWeek'];
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;

      const scheduleWithSeconds = {
        id: id ?? undefined,
        dayOfWeek,
        startTime: startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime,
        endTime: endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:00` : endTime,
      };

      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.createOrUpdateDailySchedules({
        requestBody: [scheduleWithSeconds],
      });

      return data({ success: true, message: id ? 'Arbeidstid oppdatert' : 'Arbeidstid lagret' });
    }

    if (intent === 'create-default') {
      const defaultSchedules = [
        { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00:00', endTime: '15:00:00' },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00:00', endTime: '16:00:00' },
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00:00', endTime: '17:00:00' },
        { dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00:00', endTime: '17:00:00' },
        { dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00:00', endTime: '17:00:00' },
      ];

      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.createOrUpdateDailySchedules({
        requestBody: defaultSchedules,
      });

      return data({ success: true, message: 'Standard arbeidstider lagret' });
    }

    if (intent === 'delete') {
      const id = Number(formData.get('id'));
      await bookingClient.DailyScheduleControllerService.DailyScheduleControllerService.deleteDailySchedule({ id });
      return data({ success: true, message: 'Arbeidstid fjernet' });
    }

    return data({ success: false, message: 'Ugyldig handling' });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return data({ success: false, message: error.body?.message || 'En feil oppstod' }, { status: 400 });
  }
}

type FormData = {
  id?: number | null;
  dayOfWeek: DailyScheduleDto['dayOfWeek'];
  startTime: string;
  endTime: string;
};

export default function BookingDailySchedule() {
  const { dailySchedules } = useLoaderData<BookingDailyScheduleLoaderArgs>();
  const submit = useSubmit();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FormData | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);

  const sortedSchedules = [...dailySchedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  const existingDays = new Set(dailySchedules.map((s) => s.dayOfWeek));
  const missingDays = DAY_ORDER.filter((day) => !existingDays.has(day as DailyScheduleDto['dayOfWeek']));

  const handleCreateDefaultSchedule = () => {
    const formData = new FormData();
    formData.append('intent', 'create-default');
    submit(formData, { method: 'post' });
    toast.success('Standard arbeidstider lagret');
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
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Arbeidstider</h1>
          <p className="mt-1 text-sm text-slate-500">
            Velg hvilke dager og klokkeslett du er tilgjengelig for avtaler.
          </p>
        </div>

        {sortedSchedules.length === 0 && (
          <Button onClick={handleCreateDefaultSchedule} className="rounded-md px-5">
            Sett standard arbeidstider
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
        {sortedSchedules.length === 0 ? (
          <p className="text-sm text-slate-500">
            Du har ikke lagt inn noen arbeidstider ennå. Du kan starte med standard arbeidstider eller legge inn dagene
            manuelt.
          </p>
        ) : (
          <>
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

            {missingDays.length > 0 && (
              <div className="mt-6 rounded-md bg-slate-50 px-3 py-3">
                <p className="mb-2 text-sm font-medium text-slate-900">Dager uten arbeidstid</p>
                <p className="mb-3 text-xs text-slate-500">Klikk på en dag for å legge til arbeidstid.</p>

                <div className="flex flex-wrap gap-2">
                  {missingDays.map((day) => (
                    <Button
                      key={day}
                      variant="outline"
                      size="sm"
                      className="rounded-md border-slate-200"
                      onClick={() => handleAddDay(day)}
                    >
                      + {DAY_LABELS[day as DailyScheduleDto['dayOfWeek']]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
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

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        description="Er du sikker på at du vil fjerne denne arbeidstiden? Denne handlingen kan ikke angres."
      />
    </div>
  );
}
