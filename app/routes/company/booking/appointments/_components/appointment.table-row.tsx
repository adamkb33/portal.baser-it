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
  KeyValueList,
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
            <div className="space-y-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Kunde
              </Text>
              <Text as="p" variant="body-sm" className="mt-1 font-semibold">
                {appointment.user.givenName} {appointment.user.familyName}
              </Text>
              <KeyValueList
                layout="compact"
                items={[
                  { label: 'Mobil', value: appointment.user.mobileNumber ?? 'Ikke oppgitt' },
                  {
                    label: 'E-post',
                    value: appointment.user.email ? (
                      <Link to={`mailto:${appointment.user.email}`} className="break-all text-primary hover:underline">
                        {appointment.user.email}
                      </Link>
                    ) : (
                      'Ikke oppgitt'
                    ),
                  },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
                Oppsummering
              </Text>
              <KeyValueList
                layout="compact"
                items={[
                  { label: 'Tjenester', value: `${totalServices} stk` },
                  { label: 'Varighet', value: getTotalDuration(appointment) },
                  { label: 'Total pris', value: getTotalPrice(appointment) },
                ]}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            <Text as="p" variant="body-sm" className="font-semibold">
              Tjenester
            </Text>
            <div className="mt-2 max-h-64 space-y-3 overflow-y-auto pr-1">
              {appointment.groupedServiceGroups?.map((group) => {
                const groupServices = group.services ?? [];
                const groupDuration = groupServices.reduce((sum, service) => sum + (service.duration ?? 0), 0);
                const groupPrice = groupServices.reduce((sum, service) => sum + (service.price ?? 0), 0);

                return (
                  <div key={group.id} className="border-b border-border pb-3 last:border-b-0">
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
                      <div className="grid grid-cols-3 gap-2 px-1 pb-1">
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

                      <div className="divide-y divide-border">
                        {groupServices.map((service) => (
                          <div
                            key={service.id}
                            className="grid grid-cols-3 items-center gap-2 py-1.5 text-sm"
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
