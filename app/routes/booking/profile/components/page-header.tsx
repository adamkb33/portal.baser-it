import * as React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  description: string;
  userInitials?: string;
  userId?: number;
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle, description, userInitials, userId }, ref) => {
    return (
      <header ref={ref} className={['border border-border', 'bg-background', 'p-4 sm:p-5', 'space-y-3'].join(' ')}>
        <div className={['flex items-center justify-between', 'gap-3'].join(' ')}>
          <div className={['flex flex-col', 'gap-1'].join(' ')}>
            <span
              className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(
                ' ',
              )}
            >
              {subtitle}
            </span>
            <h1 className={['text-base', 'font-semibold', 'text-foreground'].join(' ')}>{title}</h1>
            <p className={['text-[0.8rem]', 'text-muted-foreground'].join(' ')}>{description}</p>
          </div>

          {userInitials && userId !== undefined && (
            <div className={['flex flex-col items-end', 'gap-1'].join(' ')}>
              <div
                className={[
                  'flex h-12 w-12',
                  'items-center justify-center',
                  'border border-border',
                  'bg-muted',
                  'text-sm font-semibold',
                  'leading-none',
                ].join(' ')}
                aria-label={`User initials: ${userInitials}`}
              >
                {userInitials}
              </div>
              <span className={['text-[0.7rem]', 'text-muted-foreground'].join(' ')}>ID: {userId}</span>
            </div>
          )}
        </div>
      </header>
    );
  },
);

PageHeader.displayName = 'PageHeader';
