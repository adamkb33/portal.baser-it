import * as React from 'react';
import type { BookingProfileDto } from 'tmp/openapi/gen/booking';
import { Button } from '~/components/ui/button';

export interface BookingProfileCardProps {
  bookingProfile?: BookingProfileDto | null;
  onEditProfile?: () => void;
}

export const BookingProfileCard = React.forwardRef<HTMLElement, BookingProfileCardProps>(
  ({ bookingProfile, onEditProfile }, ref) => {
    const hasProfileImage = Boolean(bookingProfile?.image);
    const hasDescription = Boolean(bookingProfile?.description?.trim());
    const hasServices = Boolean(bookingProfile?.services && bookingProfile.services.length > 0);

    return (
      <section ref={ref} className="border border-border bg-background p-4 sm:p-5 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Offentlig bookingprofil
            </p>
            <p className="text-sm font-semibold text-foreground">Slik vises du til kunder</p>
            <p className="text-[0.7rem] text-muted-foreground">
              Denne beskrivelsen og bildet er synlig for kunder når de booker time med deg.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className="border border-border px-2 py-0.5 text-xs text-muted-foreground"
              aria-label={hasProfileImage ? 'Profile image is set' : 'No profile image'}
            >
              {hasProfileImage ? 'Profilbilde satt' : 'Ingen profilbilde'}
            </span>

            {hasProfileImage && bookingProfile?.image ? (
              <div className="border border-border bg-muted p-2">
                <img
                  src={bookingProfile.image.url}
                  alt={bookingProfile.image.label || 'Profilbilde'}
                  className="h-24 w-24 border border-border bg-background object-cover"
                />
              </div>
            ) : (
              <div className="border border-border bg-muted px-3 py-4 text-[0.7rem] text-muted-foreground leading-snug">
                Ingen bilde lastet opp.
                <br />
                Du vil vises kun med initialer.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Beskrivelse</p>

          <div className="border border-border bg-muted p-3 sm:p-4">
            {hasDescription ? (
              <p className="text-[0.8rem] text-foreground leading-relaxed">{bookingProfile?.description}</p>
            ) : (
              <p className="text-[0.8rem] text-muted-foreground">
                Ingen beskrivelse lagt til ennå. Du kan bruke dette feltet til å fortelle kunder om dine spesialiteter,
                arbeidsområder eller andre relevante detaljer.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Tjenester</p>

          <div className="border border-border bg-background p-3 sm:p-4">
            {hasServices ? (
              <div className="space-y-3">
                {bookingProfile!.services.map((service) => (
                  <div key={service.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{service.name}</p>
                        <p className="text-[0.7rem] text-muted-foreground mt-1">
                          {service.duration} min • kr {service.price}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[0.8rem] text-muted-foreground">
                Ingen tjenester lagt til ennå. Legg til tjenester for å la kunder bestille time.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="default" onClick={onEditProfile}>
            Rediger bookingprofil
          </Button>
        </div>
      </section>
    );
  },
);

BookingProfileCard.displayName = 'BookingProfileCard';
