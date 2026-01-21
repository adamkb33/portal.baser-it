// components/appointments/appointment-table-row.tsx
import { TableRow, TableCell } from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Link } from 'react-router';
import { parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getTotalDuration, getTotalPrice, getTotalServiceCount } from '../_utils/appointments.utils';
import type { AppointmentDto } from '~/api/generated/booking';

type AppointmentTableRowProps = {
  appointment: AppointmentDto;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
};

export function AppointmentTableRow({ appointment, onDelete, isDeleting = false }: AppointmentTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{format(parseISO(appointment.startTime), 'HH:mm d. MMM yy', { locale: nb })}</span>
        </div>
      </TableCell>

      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" size="sm" className="h-7 px-0">
              {appointment.contact.givenName} {appointment.contact.familyName}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm border-b border-border pb-2">Kundeinformasjon</h4>
              <div className="space-y-2 text-sm">
                {appointment.contact.givenName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Fornavn:</span>
                    <span className="font-medium">{appointment.contact.givenName}</span>
                  </div>
                )}
                {appointment.contact.familyName && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Etternavn:</span>
                    <span className="font-medium">{appointment.contact.familyName}</span>
                  </div>
                )}
                {appointment.contact.email?.value && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">E-post:</span>
                    <Link
                      to={`mailto:${appointment.contact.email.value}`}
                      className="font-medium text-primary hover:underline break-all"
                    >
                      {appointment.contact.email.value}
                    </Link>
                  </div>
                )}
                {appointment.contact.mobileNumber?.value && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Telefon:</span>
                    <Link
                      to={`tel:${appointment.contact.mobileNumber.value}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {appointment.contact.mobileNumber.value}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell>
        {getTotalServiceCount(appointment) > 1 ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-background hover:bg-accent transition-colors">
                <span className="text-xs font-medium">Klikk for å se alle</span>
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {getTotalServiceCount(appointment)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 border-b border-border bg-muted/30">
                <h4 className="font-bold text-sm">
                  Tjenester{' '}
                  <span className="text-muted-foreground font-normal">({getTotalServiceCount(appointment)})</span>
                </h4>
              </div>
              <div className="p-4 space-y-4 max-h-[320px] overflow-y-auto">
                {appointment.groupedServiceGroups?.map((group, idx) => (
                  <div key={group.id} className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      <span className="font-semibold text-sm text-foreground">{group.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-3.5">
                      {group.services?.map((service) => (
                        <span
                          key={service.id}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs border border-border/50"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                    {idx < appointment.groupedServiceGroups.length - 1 && (
                      <div className="pt-2">
                        <div className="h-px bg-border/50" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{appointment.groupedServiceGroups?.[0]?.name}</span>
            <span className="text-sm font-medium">{appointment.groupedServiceGroups?.[0]?.services?.[0]?.name}</span>
          </div>
        )}
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
            onClick={() => onDelete(appointment.id!)}
            disabled={isDeleting}
          >
            Slett
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
