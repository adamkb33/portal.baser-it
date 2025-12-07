// // routes/booking/appointments.tsx
// import {
//   data,
//   Link,
//   redirect,
//   useLoaderData,
//   useFetcher,
//   useLocation,
//   useSubmit,
//   type LoaderFunctionArgs,
//   type ActionFunctionArgs,
// } from 'react-router';
// import * as React from 'react';
// import { toast } from 'sonner';
// import type { AppointmentDto } from 'tmp/openapi/gen/booking';
// import { createBookingClient } from '~/api/clients/booking';
// import { createBaseClient, type ContactDto } from '~/api/clients/base';
// import type { ApiClientError } from '~/api/clients/http';
// import { ENV } from '~/api/config/env';
// import { getAccessToken } from '~/lib/auth.utils';
// import { Button } from '~/components/ui/button';
// import { Input } from '~/components/ui/input';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
// import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
// import { DeleteConfirmDialog } from '~/components/dialog/delete-confirm-dialog';
// import { SortableHeader, type SortDirection, type SortableColumn } from '~/components/table/sortable-header';
// import { Trash, ZoomIn } from 'lucide-react';

// export type ContactSlim = {
//   id: number;
//   givenName: string;
//   familyName: string;
//   email?: string;
//   mobileNumber?: string;
// };

// // Backend defaults to DESC and startTime
// const DEFAULT_SORT_FIELD: SortableColumn = 'startTime';
// const DEFAULT_SORT_DIRECTION: SortDirection = 'asc';
// const DEFAULT_PAGE_SIZE = 5;

// type DatePreset = 'kommende' | 'utgåtte' | 'custom';
// const DATE_PRESET_OPTIONS: Array<{ label: string; value: DatePreset }> = [
//   { label: 'Kommende', value: 'kommende' },
//   { label: 'Utgåtte', value: 'utgåtte' },
// ];

// // UI sort key -> API sortBy (only startTime and endTime are supported by backend)
// const SORT_FIELD_TO_API_FIELD: Record<SortableColumn, string> = {
//   startTime: 'startTime',
//   endTime: 'endTime',
// };

// export type CombinedAppointment = AppointmentDto & {
//   contact: ContactSlim | null;
// };

// export type PaginationInfo = {
//   page: number;
//   size: number;
//   totalElements: number;
//   totalPages: number;
//   hasNext: boolean;
//   hasPrevious: boolean;
// };

// export type BookingAppointmentsLoaderData = {
//   appointments: CombinedAppointment[];
//   pagination: PaginationInfo;
//   error?: string;
//   sortField: SortableColumn;
//   sortDirection: SortDirection;
//   fromDate: string;
//   toDate?: string | null;
//   datePreset: DatePreset;
//   today: string;
// };

// // Loader
// export async function loader({ request }: LoaderFunctionArgs) {
//   const today = formatDateOnly(new Date());

//   try {
//     const accessToken = await getAccessToken(request);
//     if (!accessToken) return redirect('/');

//     const bookingClient = createBookingClient({
//       baseUrl: ENV.BOOKING_BASE_URL,
//       token: accessToken,
//     });

//     const url = new URL(request.url);
//     const pageParam = Number(url.searchParams.get('page'));
//     const sizeParam = Number(url.searchParams.get('size'));
//     const sortByParam = url.searchParams.get('sortBy');
//     const sortDirectionParam = url.searchParams.get('sortDirection');
//     const fromDateTimeParam = url.searchParams.get('fromDateTime');
//     const toDateTimeParam = url.searchParams.get('toDateTime');

//     // Only allow startTime or endTime for sorting (backend restriction)
//     const sortField: SortableColumn = isValidSortField(sortByParam) ? sortByParam : DEFAULT_SORT_FIELD;
//     const sortDirection: SortDirection =
//       sortDirectionParam === 'asc' || sortDirectionParam === 'desc' ? sortDirectionParam : DEFAULT_SORT_DIRECTION;
//     const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;
//     const size = Number.isFinite(sizeParam) && sizeParam > 0 ? sizeParam : DEFAULT_PAGE_SIZE;

//     const hasFromDate = isValidDate(fromDateTimeParam);
//     const hasToDate = isValidDate(toDateTimeParam);

//     const resolvedFromDate = hasFromDate ? fromDateTimeParam! : hasToDate ? undefined : today;
//     const resolvedToDate = hasToDate ? toDateTimeParam! : undefined;

//     const datePreset: DatePreset =
//       resolvedFromDate === today && !resolvedToDate
//         ? 'kommende'
//         : !resolvedFromDate && Boolean(resolvedToDate)
//           ? 'utgåtte'
//           : 'custom';

//     const sortBy = SORT_FIELD_TO_API_FIELD[sortField];

//     // Backend expects full ISO-8601 datetime strings
//     const fromDateTime = resolvedFromDate ? `${resolvedFromDate}T00:00:00` : undefined;
//     const toDateTime = resolvedToDate ? `${resolvedToDate}T23:59:59` : undefined;

//     const listRes =
//       await bookingClient.CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.getAppointments(
//         {
//           page,
//           size,
//           sortBy,
//           sortDirection,
//           fromDateTime,
//           toDateTime,
//         },
//       );

//     // Extract paginated response
//     const apiPayload = (listRes.data as any)?.data ?? listRes.data;
//     const paginatedResponse = apiPayload?.content
//       ? apiPayload
//       : { content: [], page: 0, size, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false };

//     const appointments: AppointmentDto[] = Array.isArray(paginatedResponse.content) ? paginatedResponse.content : [];

//     const pagination: PaginationInfo = {
//       page: paginatedResponse.page ?? 0,
//       size: paginatedResponse.size ?? size,
//       totalElements: paginatedResponse.totalElements ?? 0,
//       totalPages: paginatedResponse.totalPages ?? 0,
//       hasNext: paginatedResponse.hasNext ?? false,
//       hasPrevious: paginatedResponse.hasPrevious ?? false,
//     };

//     let combined: CombinedAppointment[] = appointments.map((a) => ({ ...a, contact: null }));
//     let nonBlockingError: string | undefined;

//     if (appointments.length > 0) {
//       try {
//         const baseClient = createBaseClient({
//           baseUrl: ENV.BASE_SERVICE_BASE_URL,
//           token: accessToken,
//         });

//         const uniqueContactIds = Array.from(
//           new Set(
//             appointments
//               .map((a) => a.contactId)
//               .filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
//           ),
//         );

//         if (uniqueContactIds.length > 0) {
//           const contactsRes =
//             await baseClient.CompanyUserContactControllerService.CompanyUserContactControllerService.getContactsByIds({
//               requestBody: { contactIds: uniqueContactIds },
//             });

//           const rawContacts = contactsRes.data as any;
//           const contacts: ContactDto[] = Array.isArray(rawContacts)
//             ? rawContacts
//             : Array.isArray(rawContacts?.content)
//               ? rawContacts.content
//               : [];

//           const byId = new Map<number, ContactSlim>(
//             contacts.map((c) => [
//               c.id,
//               {
//                 id: c.id,
//                 givenName: c.givenName,
//                 familyName: c.familyName,
//                 email: c.email?.value ?? undefined,
//                 mobileNumber: c.mobileNumberDto?.value ?? undefined,
//               },
//             ]),
//           );

//           combined = appointments.map((a) => ({
//             ...a,
//             contact: a.contactId != null ? (byId.get(a.contactId as number) ?? null) : null,
//           }));
//         }
//       } catch (e) {
//         console.error('Contacts fetch failed:', e);
//         nonBlockingError = 'Kunne ikke hente kundedetaljer for alle avtaler.';
//       }
//     }

//     return data<BookingAppointmentsLoaderData>({
//       appointments: combined,
//       pagination,
//       error: nonBlockingError,
//       sortField,
//       sortDirection,
//       fromDate: resolvedFromDate ?? '',
//       toDate: resolvedToDate ?? null,
//       datePreset,
//       today,
//     });
//   } catch (error: any) {
//     console.error(JSON.stringify(error, null, 2));
//     const apiErr = error as ApiClientError;
//     return data<BookingAppointmentsLoaderData>({
//       appointments: [],
//       pagination: {
//         page: 0,
//         size: DEFAULT_PAGE_SIZE,
//         totalElements: 0,
//         totalPages: 0,
//         hasNext: false,
//         hasPrevious: false,
//       },
//       error: apiErr?.body?.message ?? 'Kunne ikke hente avtaler',
//       sortField: DEFAULT_SORT_FIELD,
//       sortDirection: DEFAULT_SORT_DIRECTION,
//       fromDate: today,
//       toDate: null,
//       datePreset: 'kommende',
//       today,
//     });
//   }
// }

// // Action: delete
// export async function action({ request }: ActionFunctionArgs) {
//   try {
//     const accessToken = await getAccessToken(request);
//     if (!accessToken) return redirect('/');

//     const formData = await request.formData();
//     const intent = formData.get('intent') as string;

//     if (intent === 'delete') {
//       const id = Number(formData.get('id'));
//       if (!id || Number.isNaN(id)) {
//         return data({ success: false, message: 'Ugyldig avtale-ID' }, { status: 400 });
//       }

//       const bookingClient = createBookingClient({
//         baseUrl: ENV.BOOKING_BASE_URL,
//         token: accessToken,
//       });

//       await bookingClient.CompanyUserAppointmentControllerService.CompanyUserAppointmentControllerService.deleteAppointment(
//         { id },
//       );

//       return data({ success: true, message: 'Avtale slettet' });
//     }

//     return data({ success: false, message: 'Ugyldig handling' }, { status: 400 });
//   } catch (error: any) {
//     console.error(JSON.stringify(error, null, 2));
//     const message = (error as ApiClientError)?.body?.message || 'En feil oppstod';
//     return data({ success: false, message }, { status: 400 });
//   }
// }

// export default function BookingAppointments() {
//   const { appointments, pagination, error, sortField, sortDirection, fromDate, toDate, datePreset, today } =
//     useLoaderData<BookingAppointmentsLoaderData>();
//   const fetcher = useFetcher<{ success: boolean; message: string }>();
//   const submit = useSubmit();
//   const location = useLocation();

//   const [filter, setFilter] = React.useState('');
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
//   const [deletingAppointmentId, setDeletingAppointmentId] = React.useState<number | null>(null);

//   React.useEffect(() => {
//     if (fetcher.state === 'idle' && fetcher.data) {
//       if (fetcher.data.success) {
//         toast.success(fetcher.data.message || 'Avtalen ble slettet');
//       } else {
//         toast.error(fetcher.data.message || 'Kunne ikke slette avtalen');
//       }
//     }
//   }, [fetcher.state, fetcher.data]);

//   const filtered = React.useMemo(() => {
//     if (!filter) return appointments;
//     const f = filter.toLowerCase();
//     const safe = (v?: string | null) => (v ?? '').toLowerCase();

//     return appointments.filter((a) => {
//       const name = a.contact ? `${a.contact.givenName} ${a.contact.familyName}` : '';
//       const svc = (a.services ?? []).map((s) => s?.name ?? '').join(', ');

//       const startDate = getDatePartFromLocalDateTime(a.startTime);
//       const endDate = getDatePartFromLocalDateTime(a.endTime);

//       return (
//         safe(name).includes(f) ||
//         safe(svc).includes(f) ||
//         safe(formatNorTime(a.startTime)).includes(f) ||
//         safe(formatNorTime(a.endTime)).includes(f) ||
//         safe(startDate).includes(f) ||
//         safe(endDate).includes(f) ||
//         safe(formatNorDateFromDateTime(a.startTime)).includes(f)
//       );
//     });
//   }, [appointments, filter]);

//   const handleDeleteConfirm = () => {
//     if (!deletingAppointmentId) return;

//     const fd = new FormData();
//     fd.append('intent', 'delete');
//     fd.append('id', String(deletingAppointmentId));

//     fetcher.submit(fd, { method: 'post' });
//     setIsDeleteDialogOpen(false);
//     setDeletingAppointmentId(null);
//   };

//   const submitWithParams = React.useCallback(
//     (update: (params: URLSearchParams) => void) => {
//       const params = new URLSearchParams(location.search);
//       update(params);
//       const formData = new FormData();
//       params.forEach((value, key) => formData.set(key, value));
//       submit(formData, { method: 'get', action: location.pathname });
//     },
//     [location.pathname, location.search, submit],
//   );

//   const handleSort = React.useCallback(
//     (field: SortableColumn) => {
//       const isActive = sortField === field;
//       // Toggle between asc and desc, matching backend expectations
//       const nextDirection: SortDirection = isActive && sortDirection === 'desc' ? 'asc' : 'desc';
//       submitWithParams((params) => {
//         params.set('sortBy', field);
//         params.set('sortDirection', nextDirection);
//         params.set('page', '0'); // Reset to first page on sort change
//       });
//     },
//     [sortDirection, sortField, submitWithParams],
//   );

//   const handleDateChange = React.useCallback(
//     (type: 'from' | 'to', value: string) => {
//       submitWithParams((params) => {
//         if (type === 'from') {
//           if (value) {
//             params.set('fromDateTime', value);
//           } else {
//             params.delete('fromDateTime');
//           }
//         } else if (type === 'to') {
//           if (value) {
//             params.set('toDateTime', value);
//           } else {
//             params.delete('toDateTime');
//           }
//         }
//         params.set('page', '0'); // Reset to first page on filter change
//       });
//     },
//     [submitWithParams],
//   );

//   const handlePageSizeChange = React.useCallback(
//     (nextSize: number) => {
//       submitWithParams((params) => {
//         params.set('size', String(nextSize));
//         params.set('page', '0'); // Reset to first page on size change
//       });
//     },
//     [submitWithParams],
//   );

//   const handlePageChange = React.useCallback(
//     (nextPage: number) => {
//       submitWithParams((params) => {
//         params.set('page', String(nextPage));
//       });
//     },
//     [submitWithParams],
//   );

//   const applyPreset = React.useCallback(
//     (preset: DatePreset) => {
//       submitWithParams((params) => {
//         if (preset === 'kommende') {
//           params.set('fromDateTime', today);
//           params.delete('toDateTime');
//           params.set('sortDirection', 'asc');
//         } else if (preset === 'utgåtte') {
//           params.delete('fromDateTime');
//           params.set('toDateTime', today);
//           params.set('sortDirection', 'desc');
//         } else {
//           params.delete('fromDateTime');
//           params.delete('toDateTime');
//         }
//         params.set('page', '0'); // Reset to first page on preset change
//       });
//     },
//     [submitWithParams, today],
//   );

//   const startIndex = pagination.page * pagination.size;
//   const endIndex = Math.min(pagination.totalElements, startIndex + filtered.length);

//   return (
//     <div className="container mx-auto py-6 space-y-6">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="text-xl font-semibold">Avtaler</h1>
//         <Button asChild>
//           <Link to="/booking/appointments/create">Ny avtale</Link>
//         </Button>
//       </div>

//       {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

//       <div className="flex flex-col gap-4 py-4">
//         <Input
//           placeholder="Filtrer (navn, dato, tid, tjenester)..."
//           value={filter}
//           onChange={(e) => setFilter(e.target.value)}
//           className="max-w-sm"
//         />
//         <div className="flex flex-wrap items-center gap-2">
//           {DATE_PRESET_OPTIONS.map((preset) => (
//             <Button
//               key={preset.value}
//               variant={datePreset === preset.value ? 'default' : 'outline'}
//               size="sm"
//               className="rounded-full"
//               onClick={() => applyPreset(preset.value)}
//             >
//               {preset.label}
//             </Button>
//           ))}
//         </div>
//         <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
//           <label className="flex flex-col gap-1">
//             <span className="font-medium text-slate-600">Fra dato</span>
//             <Input
//               type="date"
//               value={fromDate}
//               onChange={(e) => handleDateChange('from', e.target.value)}
//               className="w-48"
//             />
//           </label>
//           <label className="flex flex-col gap-1">
//             <span className="font-medium text-slate-600">Til dato</span>
//             <Input
//               type="date"
//               value={toDate ?? ''}
//               onChange={(e) => handleDateChange('to', e.target.value)}
//               className="w-48"
//             />
//           </label>
//         </div>
//       </div>

//       <div className="overflow-hidden rounded-md border">
//         {/* Pagination Controls - Top */}
//         <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
//           <div className="text-sm text-muted-foreground">
//             Viser {pagination.totalElements ? startIndex + 1 : 0}–{endIndex} av {pagination.totalElements}
//           </div>

//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Per side</span>
//               <Select value={String(pagination.size)} onValueChange={(v) => handlePageSizeChange(Number(v))}>
//                 <SelectTrigger className="h-8 w-[92px]">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {[5, 10, 20, 50].map((opt) => (
//                     <SelectItem key={opt} value={String(opt)}>
//                       {opt}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => handlePageChange(0)}
//                 disabled={!pagination.hasPrevious}
//               >
//                 « Første
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => handlePageChange(Math.max(0, pagination.page - 1))}
//                 disabled={!pagination.hasPrevious}
//               >
//                 ← Forrige
//               </Button>
//               <div className="px-2 text-sm tabular-nums">
//                 Side {pagination.page + 1} / {pagination.totalPages || 1}
//               </div>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => handlePageChange(Math.min(pagination.totalPages - 1, pagination.page + 1))}
//                 disabled={!pagination.hasNext}
//               >
//                 Neste →
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => handlePageChange(pagination.totalPages - 1)}
//                 disabled={!pagination.hasNext}
//               >
//                 Siste »
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Kunde</TableHead>
//               <TableHead>Dato</TableHead>
//               <TableHead>
//                 <SortableHeader
//                   label="Start tid"
//                   field="startTime"
//                   activeField={sortField}
//                   direction={sortDirection}
//                   onSort={handleSort}
//                 />
//               </TableHead>
//               <TableHead>
//                 <SortableHeader
//                   label="Slutt tid"
//                   field="endTime"
//                   activeField={sortField}
//                   direction={sortDirection}
//                   onSort={handleSort}
//                 />
//               </TableHead>
//               <TableHead>Tjenester</TableHead>
//               <TableHead className="text-right">Detaljer</TableHead>
//               <TableHead className="text-right">Slett</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filtered.length ? (
//               filtered.map((a) => (
//                 <TableRow key={a.id}>
//                   <TableCell className="font-medium">
//                     {a.contact ? `${a.contact.givenName} ${a.contact.familyName}` : 'Ukjent'}
//                   </TableCell>
//                   <TableCell>{formatNorDateFromDateTime(a.startTime)}</TableCell>
//                   <TableCell>{formatNorTime(a.startTime)}</TableCell>
//                   <TableCell>{formatNorTime(a.endTime)}</TableCell>
//                   <TableCell>
//                     {a.services?.length ? a.services.map((s) => s?.name ?? 'Ukjent tjeneste').join(', ') : '—'}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <DetailsPopover appt={a} />
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <Button
//                       variant="ghost"
//                       className="text-red-500"
//                       size="sm"
//                       disabled={fetcher.state !== 'idle' && deletingAppointmentId === a.id}
//                       onClick={() => {
//                         setDeletingAppointmentId(a.id!);
//                         setIsDeleteDialogOpen(true);
//                       }}
//                     >
//                       <Trash />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={7} className="h-24 text-center">
//                   Ingen resultater.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       <DeleteConfirmDialog
//         open={isDeleteDialogOpen}
//         onOpenChange={setIsDeleteDialogOpen}
//         onConfirm={handleDeleteConfirm}
//         title="Slett avtale?"
//         description="Er du sikker på at du vil slette denne avtalen? Denne handlingen kan ikke angres."
//       />
//     </div>
//   );
// }

// function DetailsPopover({ appt }: { appt: CombinedAppointment }) {
//   const fullName = appt.contact ? `${appt.contact.givenName} ${appt.contact.familyName}` : 'Ukjent';
//   const email = appt.contact?.email;
//   const phone = appt.contact?.mobileNumber;
//   const totalPrice = (appt.services ?? []).reduce((sum, s) => sum + (s?.price ?? 0), 0);
//   const totalDuration = (appt.services ?? []).reduce((sum, s) => sum + (s?.duration ?? 0), 0);

//   return (
//     <Popover>
//       <PopoverTrigger asChild>
//         <Button variant="outline" size="sm">
//           <ZoomIn />
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-[360px] p-4">
//         <div className="space-y-3">
//           <div>
//             <h3 className="text-sm font-semibold">Avtale</h3>
//             <p className="text-sm text-muted-foreground">
//               {formatNorDateFromDateTime(appt.startTime)} kl. {formatNorTime(appt.startTime)}–
//               {formatNorTime(appt.endTime)}
//             </p>
//           </div>

//           <div className="border-t pt-3">
//             <h4 className="text-sm font-semibold">Kunde</h4>
//             <div className="text-sm">
//               <div className="font-medium">Navn: {fullName}</div>
//               <div className="text-muted-foreground">E-post: {email}</div>
//               <div className="text-muted-foreground">Mobil: {phone}</div>
//             </div>
//           </div>

//           <div className="border-t pt-3 space-y-2">
//             <h4 className="text-sm font-semibold">Tjenester</h4>
//             {(appt.services ?? []).length === 0 ? (
//               <div className="text-sm text-muted-foreground">Ingen tjenester</div>
//             ) : (
//               <ul className="text-sm space-y-1">
//                 {(appt.services ?? []).map((s, idx) => (
//                   <li key={s?.id ?? idx} className="flex items-center justify-between">
//                     <span className="truncate">{s?.name ?? 'Ukjent tjeneste'}</span>
//                     <span className="ml-3 shrink-0 text-muted-foreground">
//                       {s?.duration ?? 0} min • {formatNok(s?.price)}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             )}
//             <div className="flex items-center justify-between border-t pt-2 text-sm">
//               <span className="font-medium">Sum</span>
//               <span className="text-muted-foreground">
//                 {totalDuration} min • {formatNok(totalPrice)}
//               </span>
//             </div>
//           </div>

//           <div className="border-t pt-3 text-xs text-muted-foreground">Avtale-ID: {appt.id}</div>
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// }

// function getDatePartFromLocalDateTime(dateTime?: string) {
//   if (!dateTime) return undefined;
//   const [date] = dateTime.split('T');
//   return date || undefined;
// }

// function formatNorDateFromDateTime(dateTime?: string) {
//   const dateOnly = getDatePartFromLocalDateTime(dateTime);
//   return formatNorDate(dateOnly);
// }

// function formatNorTime(dateTime?: string) {
//   if (!dateTime) return '—';
//   const d = new Date(dateTime);
//   if (Number.isNaN(d.getTime())) return '—';
//   return d.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
// }

// function formatNok(value?: number) {
//   const n = Number(value ?? 0);
//   return n.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' });
// }

// function formatNorDate(dateISO?: string) {
//   if (!dateISO) return '—';
//   const d = dateISO.length === 10 ? new Date(`${dateISO}T00:00:00`) : new Date(dateISO);
//   if (Number.isNaN(d.getTime())) return '—';
//   return d.toLocaleDateString('no-NO', { day: '2-digit', month: 'long', year: 'numeric' });
// }

// function isValidSortField(value: string | null): value is SortableColumn {
//   if (!value) return false;
//   return value in SORT_FIELD_TO_API_FIELD;
// }

// function isValidDate(value: string | null): value is string {
//   if (!value) return false;
//   const parsed = Date.parse(value);
//   if (Number.isNaN(parsed)) return false;
//   return /^\d{4}-\d{2}-\d{2}$/.test(value);
// }

// function formatDateOnly(date: Date) {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const day = String(date.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

import React from 'react';

// rework the appointment view for company users
export default function _index() {
  return <div>_index</div>;
}
