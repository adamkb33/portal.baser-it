// components/appointments/appointment-table-row.tsx
import { TableRow, TableCell } from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { AppointmentDto } from 'tmp/openapi/gen/booking';
import { Link } from 'react-router';
import { formatDateTime, getTotalDuration, getTotalPrice, getTotalServiceCount } from '../_utils/appointments.utils';

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
          <span>{formatDateTime(appointment.startTime)}</span>
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
              <Button variant="link" size="sm" className="h-7 px-0">
                Se tjenester ({getTotalServiceCount(appointment)})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b border-border pb-2">
                  Tjenester ({getTotalServiceCount(appointment)})
                </h4>
                {appointment.groupedServiceGroups?.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <Badge variant="outline" className="font-semibold text-xs">
                        {group.name}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-3">
                      {group.services?.map((service) => (
                        <Badge key={service.id} variant="secondary" className="font-normal text-xs">
                          {service.name}
                        </Badge>
                      ))}
                    </div>
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
