import { Link } from 'react-router';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { ReactNode } from 'react';
import type { AppointmentDto } from '~/api/generated/booking';
import { KeyValueList, Panel, Text } from '~/ui';
import { getTotalDuration, getTotalPrice, getTotalServiceCount } from '../_utils/appointments.utils';

type AppointmentDetailsContentProps = {
  appointment: AppointmentDto;
  actions?: ReactNode;
};

export function AppointmentDetailsContent({ appointment, actions }: AppointmentDetailsContentProps) {
  const totalServices = getTotalServiceCount(appointment);
  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const images = appointment.images ?? [];

  return (
    <div className="grid gap-4">
      <Panel
        title="Avtaledetaljer"
        description={`${format(startTime, 'PPPp', { locale: nb })} - ${totalServices} ${
          totalServices === 1 ? 'tjeneste' : 'tjenester'
        }.`}
        action={actions}
      >
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
                { label: 'Dato', value: format(startTime, 'd. MMM yyyy', { locale: nb }) },
                {
                  label: 'Tid',
                  value: `${format(startTime, 'HH:mm', { locale: nb })} - ${format(endTime, 'HH:mm', { locale: nb })}`,
                },
                { label: 'Tjenester', value: `${totalServices} stk` },
                { label: 'Varighet', value: getTotalDuration(appointment) },
                { label: 'Total pris', value: getTotalPrice(appointment) },
              ]}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Tjenester" description="Tjenestegrupper og valgte tjenester for avtalen.">
        {appointment.groupedServiceGroups?.length ? (
          <div className="space-y-3">
            {appointment.groupedServiceGroups.map((group) => {
              const groupServices = group.services ?? [];
              const groupDuration = groupServices.reduce((sum, service) => sum + (service.duration ?? 0), 0);
              const groupPrice = groupServices.reduce((sum, service) => sum + (service.price ?? 0), 0);

              return (
                <div key={group.id} className="border-b border-border pb-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                    <div>
                      <Text
                        as="p"
                        variant="caption"
                        className="font-semibold uppercase tracking-wide text-text-secondary"
                      >
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
                        {groupDuration} min - {groupPrice.toLocaleString('nb-NO')} kr
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
                        <div key={service.id} className="grid grid-cols-3 items-center gap-2 py-1.5 text-sm">
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
        ) : (
          <Text as="p" variant="body-sm" className="font-semibold">
            Ingen tjenester registrert.
          </Text>
        )}
      </Panel>

      <Panel title="Bilder" description="Opplastede bilder knyttet til timebestillingen.">
        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <figure
                key={image.id ?? `${image.url}-${index}`}
                className="overflow-hidden rounded-md border border-border"
              >
                <img
                  src={image.url}
                  alt={image.label || `Avtalebilde ${index + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="space-y-0.5 px-3 py-2 text-sm">
                  <span className="block font-medium text-text-primary">{image.label || `Bilde ${index + 1}`}</span>
                  <span className="block text-xs text-text-secondary">{(image.size / 1024).toFixed(0)} KB</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <Text as="p" variant="body-sm" className="text-text-secondary">
            Ingen bilder er lastet opp.
          </Text>
        )}
      </Panel>
    </div>
  );
}
