import * as React from 'react';
import { Button } from '~/components/ui/button';

export interface UserProfileCardProps {
  givenName: string;
  familyName: string;
  email: string;
  userId: number;
  onEditDetails?: () => void;
  onSwitchAccount?: () => void;
}

export const UserProfileCard = React.forwardRef<HTMLElement, UserProfileCardProps>(
  ({ givenName, familyName, email, userId, onEditDetails, onSwitchAccount }, ref) => {
    return (
      <section ref={ref} className={['border border-border', 'bg-background', 'p-4 sm:p-5', 'space-y-5'].join(' ')}>
        {/* Basic info */}
        <div className={['flex flex-col', 'gap-3', 'sm:flex-row sm:items-start sm:justify-between'].join(' ')}>
          <div className={['flex flex-col', 'gap-1.5'].join(' ')}>
            <p
              className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(
                ' ',
              )}
            >
              Navn
            </p>
            <p className={['text-sm', 'font-semibold', 'text-foreground'].join(' ')}>
              {givenName} {familyName}
            </p>
            <p className={['text-[0.7rem]', 'text-muted-foreground'].join(' ')}>Vises på bookinger og kvitteringer.</p>
          </div>

          <div className={['flex flex-col', 'gap-1.5'].join(' ')}>
            <p
              className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(
                ' ',
              )}
            >
              E-post
            </p>
            <p className={['text-sm', 'font-medium', 'text-foreground'].join(' ')}>{email}</p>
            <p className={['text-[0.7rem]', 'text-muted-foreground'].join(' ')}>
              Her sender vi bekreftelser og oppdateringer.
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className={['border-t border-border', 'pt-4', 'flex flex-wrap', 'gap-2.5'].join(' ')}>
          <span
            className={[
              'rounded-none',
              'border border-border',
              'bg-background',
              'px-2.5 py-0.5',
              'text-[0.7rem]',
              'font-medium',
            ].join(' ')}
          >
            Bruker #{userId}
          </span>
          <span className={['border border-border', 'px-2 py-0.5', 'text-xs', 'text-muted-foreground'].join(' ')}>
            Autentisert
          </span>
        </div>

        {/* Actions */}
        <div className={['border-t border-border', 'pt-4', 'flex items-center justify-between', 'gap-3'].join(' ')}>
          <Button type="button" variant="default" size="default" onClick={onEditDetails}>
            Rediger detaljer
          </Button>
          <Button type="button" variant="link" size="default" onClick={onSwitchAccount}>
            Bruk en annen konto
          </Button>
        </div>
      </section>
    );
  },
);

UserProfileCard.displayName = 'UserProfileCard';
