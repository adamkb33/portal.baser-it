// components/appointments/appointment-table-row.tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getTotalDuration, getTotalPrice, getTotalServiceCount, isAppointmentCompleted } from '../_utils/appointments.utils';
import type { AppointmentDto } from '~/api/generated/booking';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  TableCell,
  TableRow,
  Text,
} from '~/ui';

type AppointmentTableRowProps = {
  appointment: AppointmentDto;
  onDelete: (id: number) => void;
  onUploadImage: (id: number) => void;
  isDeleting?: boolean;
};

export function AppointmentTableRow({ appointment, onDelete, onUploadImage, isDeleting = false }: AppointmentTableRowProps) {
  const isCompleted = isAppointmentCompleted(appointment);
  const totalServices = getTotalServiceCount(appointment);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  return (
    <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
      <TableRow
        className="cursor-pointer transition-colors hover:bg-surface/60 focus-within:bg-surface/60"
        onClick={() => setDetailsDialogOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setDetailsDialogOpen(true);
          }
        }}
        tabIndex={0}
        aria-label="Vis avtaledetaljer"
      >
        <TableCell className="py-4 align-top">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold leading-tight">
              {format(parseISO(appointment.startTime), 'HH:mm', { locale: nb })}
            </span>
            <span className="text-sm text-text-secondary">
              {format(parseISO(appointment.startTime), 'd. MMM yyyy', { locale: nb })}
            </span>
          </div>
        </TableCell>

        <TableCell>
          <span className="text-sm font-medium">
            {appointment.user.givenName} {appointment.user.familyName}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm text-text-primary">
            {totalServices} {totalServices === 1 ? 'tjeneste' : 'tjenester'}
          </span>
        </TableCell>

        <TableCell>
          <span className="text-sm">{getTotalDuration(appointment)}</span>
        </TableCell>

        <TableCell>
          <span className="text-sm font-semibold text-primary">{getTotalPrice(appointment)}</span>
        </TableCell>

        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(appointment.id!);
              }}
              disabled={isDeleting || isCompleted}
              title={isCompleted ? 'Fullførte avtaler kan ikke slettes' : undefined}
            >
              Slett
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avtaledetaljer</DialogTitle>
          <DialogDescription>
            {format(parseISO(appointment.startTime), 'PPPp', { locale: nb })} - {totalServices}{' '}
            {totalServices === 1 ? 'tjeneste' : 'tjenester'}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUploadImage(appointment.id!)}
            >
              Last opp bilde
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setDetailsDialogOpen(false);
                onDelete(appointment.id!);
              }}
              disabled={isDeleting || isCompleted}
              title={isCompleted ? 'Fullførte avtaler kan ikke slettes' : undefined}
            >
              Slett
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-surface p-3">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Kunde
              </Text>
              <Text as="p" variant="body-sm" className="mt-1 font-semibold">
                {appointment.user.givenName} {appointment.user.familyName}
              </Text>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Mobil</span>
                  <span className="text-text-primary">{appointment.user.mobileNumber ?? 'Ikke oppgitt'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">E-post</span>
                  {appointment.user.email ? (
                    <Link to={`mailto:${appointment.user.email}`} className="text-primary hover:underline break-all">
                      {appointment.user.email}
                    </Link>
                  ) : (
                    <span className="text-text-secondary">Ikke oppgitt</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface p-3">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Oppsummering
              </Text>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Tjenester</span>
                  <span className="font-medium text-text-primary">
                    {totalServices} {totalServices === 1 ? 'stk' : 'stk'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Varighet</span>
                  <span className="font-medium text-text-primary">{getTotalDuration(appointment)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Total pris</span>
                  <span className="font-semibold text-primary">{getTotalPrice(appointment)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <Text as="p" variant="body-sm" className="font-semibold">
              Tjenester
            </Text>
            <div className="mt-2 max-h-[260px] space-y-3 overflow-y-auto pr-1">
              {appointment.groupedServiceGroups?.map((group) => {
                const groupServices = group.services ?? [];
                const groupDuration = groupServices.reduce((sum, service) => sum + (service.duration ?? 0), 0);
                const groupPrice = groupServices.reduce((sum, service) => sum + (service.price ?? 0), 0);

                return (
                  <div key={group.id} className="rounded-md border border-border bg-surface p-2.5">
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                      <div>
                        <Text as="p" variant="caption" className="font-semibold uppercase tracking-wide text-text-secondary">
                          Tjenestegruppe
                        </Text>
                        <Text as="p" variant="body-sm" className="font-semibold text-text-primary">
                          {group.name}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text as="p" variant="caption" className="text-text-secondary">
                          {groupServices.length} {groupServices.length === 1 ? 'tjeneste' : 'tjenester'}
                        </Text>
                        <Text as="p" variant="caption" className="text-text-secondary">
                          {groupDuration} min · {groupPrice.toLocaleString('nb-NO')} kr
                        </Text>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1 pb-1">
                        <Text as="p" variant="caption" className="text-text-secondary">
                          Tjeneste
                        </Text>
                        <Text as="p" variant="caption" className="text-right text-text-secondary">
                          Varighet
                        </Text>
                        <Text as="p" variant="caption" className="text-right text-text-secondary">
                          Pris
                        </Text>
                      </div>

                      <div className="space-y-1.5">
                        {groupServices.map((service) => (
                          <div
                            key={service.id}
                            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
                          >
                            <span className="text-text-primary">{service.name}</span>
                            <span className="text-right text-text-secondary">{service.duration ?? 0} min</span>
                            <span className="text-right font-medium text-text-primary">
                              {(service.price ?? 0).toLocaleString('nb-NO')} kr
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
