import * as React from 'react';
import { Button } from '~/components/ui/button';

export interface BookingProfileCardProps {
  description?: string | null;
  imageId?: number | null;
  onEditProfile?: () => void;
  onResetDescription?: () => void;
}

export const BookingProfileCard = React.forwardRef<HTMLElement, BookingProfileCardProps>(
  ({ description, imageId, onEditProfile, onResetDescription }, ref) => {
    const hasProfileImage = Boolean(imageId);
    const hasDescription = Boolean(description?.trim());

    return (
      <section ref={ref} className={['border border-border', 'bg-background', 'p-4 sm:p-5', 'space-y-5'].join(' ')}>
        <div className={['flex flex-col', 'gap-3', 'sm:flex-row sm:items-start sm:justify-between'].join(' ')}>
          <div className={['flex flex-col', 'gap-1.5'].join(' ')}>
            <p
              className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(
                ' ',
              )}
            >
              Offentlig bookingprofil
            </p>
            <p className={['text-sm', 'font-semibold', 'text-foreground'].join(' ')}>Slik vises du til bedriften</p>
            <p className={['text-[0.7rem]', 'text-muted-foreground'].join(' ')}>
              Denne beskrivelsen og bildet er synlig for bedriftens ansatte når de administrerer bookingene dine.
            </p>
          </div>

          <div className={['flex flex-col items-end', 'gap-2'].join(' ')}>
            <span
              className={['border border-border', 'px-2 py-0.5', 'text-xs', 'text-muted-foreground'].join(' ')}
              aria-label={hasProfileImage ? 'Profile image is set' : 'No profile image'}
            >
              {hasProfileImage ? 'Profilbilde satt' : 'Ingen profilbilde'}
            </span>

            <div
              className={[
                'border border-border',
                'bg-muted',
                'px-3 py-4',
                'text-[0.7rem]',
                'text-muted-foreground',
                'leading-snug',
              ].join(' ')}
            >
              {hasProfileImage ? (
                <>
                  Bilde #{imageId}
                  <br />
                  (vises i bedriftens verktøy)
                </>
              ) : (
                <>
                  Ingen bilde lastet opp.
                  <br />
                  Du vil vises kun med initialer.
                </>
              )}
            </div>
          </div>
        </div>

        <div className={['border-t border-border', 'pt-4', 'space-y-2'].join(' ')}>
          <p
            className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(' ')}
          >
            Beskrivelse
          </p>

          <div className={['border border-border', 'bg-muted', 'p-3 sm:p-4'].join(' ')}>
            {hasDescription ? (
              <p className={['text-[0.8rem]', 'text-foreground', 'leading-relaxed'].join(' ')}>{description}</p>
            ) : (
              <p className={['text-[0.8rem]', 'text-muted-foreground'].join(' ')}>
                Ingen beskrivelse lagt til ennå. Du kan bruke dette feltet til å fortelle bedriften om dine preferanser,
                tilgangsbehov eller andre relevante notater.
              </p>
            )}
          </div>
        </div>

        <div className={['border-t border-border', 'pt-4', 'flex items-center justify-between', 'gap-3'].join(' ')}>
          <Button type="button" variant="outline" size="default" onClick={onEditProfile}>
            Rediger bookingprofil
          </Button>
          <Button type="button" variant="link" size="default" onClick={onResetDescription}>
            Tilbakestill beskrivelse
          </Button>
        </div>
      </section>
    );
  },
);

BookingProfileCard.displayName = 'BookingProfileCard';
