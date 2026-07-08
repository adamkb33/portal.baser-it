// components/appointments/appointment-table-row.tsx
import { useState } from 'react';
import { parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getTotalDuration, getTotalPrice, getTotalServiceCount, isAppointmentCompleted } from '../_utils/appointments.utils';
import type { AppointmentDto } from '~/api/generated/booking';
import {
  Button,
  Dialog,
  TableCell,
  TableRow,
} from '~/ui';
import { AppointmentDetailsContent } from './appointment-details-content';

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

      <AppointmentDetailsContent
        appointment={appointment}
        onDelete={onDelete}
        onUploadImage={onUploadImage}
        isDeleting={isDeleting}
        onClose={() => setDetailsDialogOpen(false)}
      />
    </Dialog>
  );
}
