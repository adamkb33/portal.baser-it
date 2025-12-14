import * as React from 'react';
import { Button } from '~/components/ui/button';

export interface EmptyBookingProfileProps {
  onCreateProfile: () => void;
}

export const EmptyBookingProfile = React.forwardRef<HTMLElement, EmptyBookingProfileProps>(
  ({ onCreateProfile }, ref) => {
    return (
      <section ref={ref} className={['border border-border', 'bg-background', 'p-4 sm:p-5', 'space-y-5'].join(' ')}>
        <div className={['flex flex-col', 'gap-1.5'].join(' ')}>
          <p
            className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(' ')}
          >
            Offentlig bookingprofil
          </p>
          <p className={['text-sm', 'font-semibold', 'text-foreground'].join(' ')}>Ingen profil opprettet ennå</p>
          <p className={['text-[0.8rem]', 'text-muted-foreground'].join(' ')}>
            Opprett en bookingprofil for å vise informasjon til bedriften når de administrerer bookingene dine.
          </p>
        </div>

        <div className={['border border-border', 'bg-muted', 'p-3 sm:p-4', 'space-y-2'].join(' ')}>
          <p
            className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(' ')}
          >
            Hva er en bookingprofil?
          </p>
          <p className={['text-[0.8rem]', 'text-foreground', 'leading-relaxed'].join(' ')}>
            En bookingprofil lar deg legge til en beskrivelse og et profilbilde som bedriften kan se når de behandler
            bookingene dine. Du kan bruke dette til å dele preferanser, tilgangsbehov eller andre relevante detaljer.
          </p>
        </div>

        <div className={['border-t border-border', 'pt-4'].join(' ')}>
          <Button type="button" variant="default" size="default" onClick={onCreateProfile}>
            Lag bookingprofil
          </Button>
        </div>
      </section>
    );
  },
);

EmptyBookingProfile.displayName = 'EmptyBookingProfile';
