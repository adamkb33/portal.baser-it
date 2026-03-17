import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { parseISO, format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarClock, ChevronRight, Clock3, Trash2, Wallet } from 'lucide-react';
import { getTotalServiceCount, getTotalDuration, getTotalPrice, isAppointmentCompleted } from '../_utils/appointments.utils';
import type { AppointmentDto } from '~/api/generated/booking';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Text,
  cn,
} from '~/ui';

type AppointmentCardRowProps = {
  appointment: AppointmentDto;
  onDelete: (id: number) => void;
  onUploadImage: (id: number) => void;
  isDeleting?: boolean;
  index?: number;
};

export function AppointmentCardRow({ appointment, onDelete, onUploadImage, isDeleting = false, index = 0 }: AppointmentCardRowProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const start = new Date(appointment.startTime).getTime();
  const end = new Date(appointment.endTime).getTime();
  const current = now.getTime();
  const isPast = isAppointmentCompleted(appointment);
  const isInProgress = current >= start && current <= end;
  const totalServices = getTotalServiceCount(appointment);
  const serviceNames =
    appointment.groupedServiceGroups?.flatMap((group) => (group.services ?? []).map((service) => service.name)).filter(Boolean) ?? [];

  const status = isInProgress ? 'ongoing' : isPast ? 'completed' : 'upcoming';
  const statusLabel = status === 'ongoing' ? 'Pågår nå' : status === 'completed' ? 'Fullført' : 'Kommende';

  const toneClass =
    status === 'ongoing'
      ? 'border-interactive/35 bg-surface-accent-subtle'
      : status === 'completed'
        ? 'border-border bg-surface-variant-2'
        : 'border-border bg-surface-variant-1';
  const accentClass =
    status === 'ongoing' ? 'bg-interactive' : status === 'completed' ? 'bg-secondary/70' : 'bg-primary/65';
  const zebraClass = index % 2 === 0 ? 'bg-surface-row-even' : 'bg-surface-row-odd';

  return (
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <div className={cn('relative overflow-hidden rounded-xl border shadow-sm transition-colors', toneClass)}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-surface-accent-strong/70 blur-2xl" />
        <div className={cn('h-1.5 w-full', accentClass)} />

        <div className="space-y-1.5 p-2.5">
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className={cn(
              'w-full rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
              zebraClass,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <time className="block text-xs font-semibold leading-tight text-text-primary" dateTime={appointment.startTime}>
                  {format(parseISO(appointment.startTime), "EEE d. MMM 'kl.' HH:mm", { locale: nb })}
                </time>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {appointment.user.givenName} {appointment.user.familyName}
                </p>
              </div>

              <Badge variant="outline" size="sm" className="shrink-0 text-[11px]">
                {statusLabel}
              </Badge>
            </div>

            <p className="mt-1 truncate text-xs text-text-secondary">
              {totalServices} {totalServices === 1 ? 'tjeneste' : 'tjenester'}
              {serviceNames.length > 0 ? ` · ${serviceNames.slice(0, 2).join(', ')}` : ''}
              {serviceNames.length > 2 ? ` +${serviceNames.length - 2}` : ''}
            </p>

            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-variant-2 px-2 py-1 text-[11px]">
                <Clock3 className="h-3 w-3 text-text-secondary" />
                <span className="text-text-secondary">Varighet</span>
                <span className="font-semibold text-text-primary">{getTotalDuration(appointment)}</span>
              </div>
              <div className="inline-flex items-center justify-end gap-1 rounded-full border border-border bg-surface-variant-3 px-2 py-1 text-[11px]">
                <Wallet className="h-3 w-3 text-text-secondary" />
                <span className="text-text-secondary">Pris</span>
                <span className="font-semibold text-text-primary">{getTotalPrice(appointment)}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 border-t border-border/80 px-0.5 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 flex-1 justify-between rounded-md px-2 text-xs text-text-secondary hover:text-text-primary"
              onClick={() => setDetailsOpen(true)}
            >
              Se detaljer
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            {!isPast ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-md text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(appointment.id!)}
                disabled={isDeleting}
                aria-label="Slett avtale"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avtaledetaljer</DialogTitle>
          <DialogDescription>
            {format(parseISO(appointment.startTime), 'PPPp', { locale: nb })} · {totalServices}{' '}
            {totalServices === 1 ? 'tjeneste' : 'tjenester'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onUploadImage(appointment.id!)}>
              Last opp bilde
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-surface-variant-1 p-2.5">
            <div className="flex items-center gap-2 text-text-secondary">
              <CalendarClock className="h-4 w-4" />
              <Text as="p" variant="body-sm">
                {format(parseISO(appointment.startTime), "EEEE d. MMMM 'kl.' HH:mm", { locale: nb })}
              </Text>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-variant-2 p-2.5">
            <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
              Kunde
            </Text>
            <Text as="p" variant="body-sm" className="mt-1 font-semibold">
              {appointment.user.givenName} {appointment.user.familyName}
            </Text>
            <div className="mt-2 text-sm text-text-secondary">
              {appointment.user.email ? (
                <Link to={`mailto:${appointment.user.email}`} className="break-all text-primary hover:underline">
                  {appointment.user.email}
                </Link>
              ) : (
                'Ingen e-post registrert'
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-variant-3 p-2.5">
            <Text as="p" variant="caption" className="uppercase tracking-wide text-text-secondary">
              Tjenester
            </Text>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {serviceNames.length > 0 ? (
                serviceNames.map((name, idx) => (
                  <Badge key={`${name}-${idx}`} variant="outline" size="sm" className="rounded-full">
                    {name}
                  </Badge>
                ))
              ) : (
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  Ingen tjenester registrert.
                </Text>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
