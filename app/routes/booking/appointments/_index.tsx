// routes/booking/appointments.tsx
import {
  data,
  Link,
  redirect,
  useLoaderData,
  useFetcher,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import * as React from 'react';
import { toast } from 'sonner';
import type { AppointmentDto } from 'tmp/openapi/gen/booking';
import { createBookingClient } from '~/api/clients/booking';
import { createBaseClient, type ContactDto } from '~/api/clients/base';
import type { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';
import { getAccessToken } from '~/lib/auth.utils';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { TableCell, TableRow } from '~/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
import { PaginatedTable } from '~/components/table/paginated-data-table';
import { Trash, ZoomIn } from 'lucide-react';

export type ContactSlim = {
  id: number;
  givenName: string;
  familyName: string;
  email?: string;
  mobileNumber?: string;
};

export type CombinedAppointment = AppointmentDto & {
  contact: ContactSlim | null;
};

export type BookingAppointmentsLoaderData = {
  appointments: CombinedAppointment[];
  error?: string;
};

// Loader: fetch all (no paging/sorting in URL), then join contacts
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) return redirect('/');

    const bookingClient = createBookingClient({
      baseUrl: ENV.BOOKING_BASE_URL,
      token: accessToken,
    });

    const listRes =
      await bookingClient.CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.getAppointments(
        {},
      );

    const raw = listRes.data as any;
    const appointments: AppointmentDto[] = Array.isArray(raw) ? raw : Array.isArray(raw?.content) ? raw.content : [];

    let combined: CombinedAppointment[] = appointments.map((a) => ({ ...a, contact: null }));
    let nonBlockingError: string | undefined;

    if (appointments.length > 0) {
      try {
        const baseClient = createBaseClient({
          baseUrl: ENV.BASE_SERVICE_BASE_URL,
          token: accessToken,
        });

        const uniqueContactIds = Array.from(
          new Set(
            appointments
              .map((a) => a.contactId)
              .filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
          ),
        );

        if (uniqueContactIds.length > 0) {
          const contactsRes =
            await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.getContactsByIds({
              requestBody: { contactIds: uniqueContactIds },
            });

          const rawContacts = contactsRes.data as any;
          const contacts: ContactDto[] = Array.isArray(rawContacts)
            ? rawContacts
            : Array.isArray(rawContacts?.content)
              ? rawContacts.content
              : [];

          const byId = new Map<number, ContactSlim>(
            contacts.map((c) => [
              c.id,
              {
                id: c.id,
                givenName: c.givenName,
                familyName: c.familyName,
                // ContactDto.email?: { id, email }
                email: c.email?.email ?? undefined,
                // ContactDto.mobileNumberDto?: { id, mobileNumber }
                mobileNumber: c.mobileNumberDto?.mobileNumber ?? undefined,
              },
            ]),
          );

          combined = appointments.map((a) => ({
            ...a,
            contact: a.contactId != null ? (byId.get(a.contactId as number) ?? null) : null,
          }));
        }
      } catch (e) {
        console.error('Contacts fetch failed:', e);
        nonBlockingError = 'Kunne ikke hente kundedetaljer for alle avtaler.';
      }
    }

    return data<BookingAppointmentsLoaderData>({
      appointments: combined,
      error: nonBlockingError,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    const apiErr = error as ApiClientError;
    return data<BookingAppointmentsLoaderData>({
      appointments: [],
      error: apiErr?.body?.message ?? 'Kunne ikke hente avtaler',
    });
  }
}

// Action: delete
export async function action({ request }: ActionFunctionArgs) {
  try {
    const accessToken = await getAccessToken(request);
    if (!accessToken) return redirect('/');

    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    if (intent === 'delete') {
      const id = Number(formData.get('id'));
      if (!id || Number.isNaN(id)) {
        return data({ success: false, message: 'Ugyldig avtale-ID' }, { status: 400 });
      }

      const bookingClient = createBookingClient({
        baseUrl: ENV.BOOKING_BASE_URL,
        token: accessToken,
      });

      await bookingClient.CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.deleteAppointment(
        { id },
      );

      return data({ success: true, message: 'Avtale slettet' });
    }

    return data({ success: false, message: 'Ugyldig handling' }, { status: 400 });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    const message = (error as ApiClientError)?.body?.message || 'En feil oppstod';
    return data({ success: false, message }, { status: 400 });
  }
}

export default function BookingAppointments() {
  const { appointments, error } = useLoaderData<BookingAppointmentsLoaderData>();
  const fetcher = useFetcher<{ success: boolean; message: string }>();

  const [filter, setFilter] = React.useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        toast.success(fetcher.data.message || 'Avtalen ble slettet');
      } else {
        toast.error(fetcher.data.message || 'Kunne ikke slette avtalen');
      }
    }
  }, [fetcher.state, fetcher.data]);

  const filtered = React.useMemo(() => {
    if (!filter) return appointments;
    const f = filter.toLowerCase();
    const safe = (v?: string | null) => (v ?? '').toLowerCase();

    return appointments.filter((a) => {
      const name = a.contact ? `${a.contact.givenName} ${a.contact.familyName}` : '';
      const svc = (a.services ?? []).map((s) => s?.name ?? '').join(', ');
      return (
        safe(name).includes(f) ||
        safe(svc).includes(f) ||
        safe(a.startTime).includes(f) ||
        safe(a.endTime).includes(f) ||
        safe(a.date as unknown as string).includes(f)
      );
    });
  }, [appointments, filter]);

  const handleDeleteConfirm = () => {
    if (!deletingAppointmentId) return;

    const fd = new FormData();
    fd.append('intent', 'delete');
    fd.append('id', String(deletingAppointmentId));

    fetcher.submit(fd, { method: 'post' });
    setIsDeleteDialogOpen(false);
    setDeletingAppointmentId(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Avtaler</h1>
        <Button asChild>
          <Link to="/booking/appointments/create">Ny avtale</Link>
        </Button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrer (navn, dato, tid, tjenester)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <PaginatedTable
        items={filtered}
        initialPageSize={10}
        columns={[
          { header: 'Kunde' },
          { header: 'Dato' },
          { header: 'Start tid' },
          { header: 'Slutt tid' },
          { header: 'Tjenester' },
          { header: 'Detaljer', className: 'text-right' },
          { header: 'Slett', className: 'text-right' },
        ]}
        getRowKey={(a) => a.id!}
        renderRow={(a) => (
          <TableRow>
            <TableCell className="font-medium">
              {a.contact ? `${a.contact.givenName} ${a.contact.familyName}` : 'Ukjent'}
            </TableCell>
            <TableCell>{formatNorDate(String(a.date))}</TableCell>
            <TableCell>{a.endTime}</TableCell>
            <TableCell>{a.endTime}</TableCell>
            <TableCell>
              {a.services?.length ? a.services.map((s) => s?.name ?? 'Ukjent tjeneste').join(', ') : '—'}
            </TableCell>
            <TableCell className="text-right">
              <DetailsPopover appt={a} />
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                className="text-red-500"
                size="sm"
                disabled={fetcher.state !== 'idle' && deletingAppointmentId === a.id}
                onClick={() => {
                  setDeletingAppointmentId(a.id!);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash />
              </Button>
            </TableCell>
          </TableRow>
        )}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Slett avtale?"
        description="Er du sikker på at du vil slette denne avtalen? Denne handlingen kan ikke angres."
      />
    </div>
  );
}

function DetailsPopover({ appt }: { appt: CombinedAppointment }) {
  const fullName = appt.contact ? `${appt.contact.givenName} ${appt.contact.familyName}` : 'Ukjent';
  const email = appt.contact?.email;
  const phone = appt.contact?.mobileNumber;
  const totalPrice = (appt.services ?? []).reduce((sum, s) => sum + (s?.price ?? 0), 0);
  const totalDuration = (appt.services ?? []).reduce((sum, s) => sum + (s?.duration ?? 0), 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ZoomIn />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Avtale</h3>
            <p className="text-sm text-muted-foreground">
              {formatNorDate(String(appt.date))} kl. {appt.startTime ?? '—'}–{appt.endTime ?? '—'}
            </p>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-semibold">Kunde</h4>
            <div className="text-sm">
              <div className="font-medium">Navn: {fullName}</div>
              <div className="text-muted-foreground">E-post: {email}</div>
              <div className="text-muted-foreground">Mobil: {phone}</div>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h4 className="text-sm font-semibold">Tjenester</h4>
            {(appt.services ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">Ingen tjenester</div>
            ) : (
              <ul className="text-sm space-y-1">
                {(appt.services ?? []).map((s, idx) => (
                  <li key={s?.id ?? idx} className="flex items-center justify-between">
                    <span className="truncate">{s?.name ?? 'Ukjent tjeneste'}</span>
                    <span className="ml-3 shrink-0 text-muted-foreground">
                      {s?.duration ?? 0} min • {formatNok(s?.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="font-medium">Sum</span>
              <span className="text-muted-foreground">
                {totalDuration} min • {formatNok(totalPrice)}
              </span>
            </div>
          </div>

          <div className="border-t pt-3 text-xs text-muted-foreground">Avtale-ID: {appt.id}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatNok(value?: number) {
  const n = Number(value ?? 0);
  return n.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' });
}

function formatNorDate(dateISO?: string) {
  if (!dateISO) return '—';
  const d = dateISO.length === 10 ? new Date(`${dateISO}T00:00:00`) : new Date(dateISO);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('no-NO', { day: '2-digit', month: 'long', year: 'numeric' });
}
