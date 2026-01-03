// components/appointments/appointment-card-row.tsx
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { User, Trash2, Clock, Banknote, Info } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { AppointmentDto } from 'tmp/openapi/gen/booking';
import { Link } from 'react-router';

type AppointmentCardRowProps = {
  appointment: AppointmentDto;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  formatDateTime: (dateTime: string) => string;
  getTotalDuration: (appointment: AppointmentDto) => string;
  getTotalPrice: (appointment: AppointmentDto) => string;
  getTotalServiceCount: (appointment: AppointmentDto) => number;
};

export function AppointmentCardRow({
  appointment,
  onDelete,
  isDeleting = false,
  formatDateTime,
  getTotalDuration,
  getTotalPrice,
  getTotalServiceCount,
}: AppointmentCardRowProps) {
  const totalServices = getTotalServiceCount(appointment);
  const isPast = new Date(appointment.startTime) < new Date();

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        isPast && 'opacity-60 grayscale-[0.3]',
        !isPast && 'border-l-4 border-l-primary shadow-sm hover:shadow-md',
      )}
    >
      <CardContent className="p-3 space-y-2.5 md:p-4 md:space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <time
              className="block text-base font-semibold text-foreground leading-tight md:text-lg"
              dateTime={appointment.startTime}
            >
              {formatDateTime(appointment.startTime)}
            </time>

            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>
                {appointment.contact.givenName} {appointment.contact.familyName}
              </span>
            </p>
          </div>

          {isPast && (
            <Badge variant="secondary" className="text-xs font-medium shrink-0">
              Fullført
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:h-9 md:w-9 text-destructive hover:bg-destructive/10 shrink-0 -mr-2 -mt-1"
            onClick={() => onDelete(appointment.id!)}
            disabled={isDeleting}
            aria-label="Slett avtale"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="space-y-2">
          {totalServices > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tjenester</span>

              {appointment.groupedServiceGroups?.[0]?.services?.slice(0, 2).map((service) => (
                <Badge
                  key={service.id}
                  variant="secondary"
                  className="text-xs font-normal bg-secondary/20 text-secondary-foreground"
                >
                  {service.name}
                </Badge>
              ))}

              {totalServices > 2 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 md:h-6 md:px-2 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      +{totalServices - 2} til
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                        Alle tjenester ({totalServices})
                      </h4>
                      {appointment.groupedServiceGroups?.map((group) => (
                        <div key={group.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-primary" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {group.name}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pl-3">
                            {group.services?.map((service) => (
                              <Badge key={service.id} variant="secondary" className="text-xs font-normal">
                                {service.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-0.5">
                <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {appointment.groupedServiceGroups?.[0]?.name}
                </span>
                <span className="block text-sm font-semibold text-foreground">
                  {appointment.groupedServiceGroups?.[0]?.services?.[0]?.name}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:gap-x-4 pt-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs md:text-sm">Varighet:</span>
            <span className="font-semibold text-foreground text-xs md:text-sm">{getTotalDuration(appointment)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm justify-end">
            <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs md:text-sm">Pris:</span>
            <span className="font-semibold text-primary text-xs md:text-sm">{getTotalPrice(appointment)}</span>
          </div>

          <div className="col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 md:h-8 w-full justify-start px-3 md:px-2 text-sm md:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Info className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  Se kontaktinformasjon
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Kundeinformasjon
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">Navn</span>
                      <span className="text-sm font-medium text-right">
                        {appointment.contact.givenName} {appointment.contact.familyName}
                      </span>
                    </div>

                    {appointment.contact.email?.value && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">E-post</span>
                        <Link
                          to={`mailto:${appointment.contact.email.value}`}
                          className="text-sm font-medium text-primary hover:underline text-right break-all"
                        >
                          {appointment.contact.email.value}
                        </Link>
                      </div>
                    )}

                    {appointment.contact.mobileNumber?.value && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">Telefon</span>
                        <Link
                          to={`tel:${appointment.contact.mobileNumber.value}`}
                          className="text-sm font-medium text-primary hover:underline text-right"
                        >
                          {appointment.contact.mobileNumber.value}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
