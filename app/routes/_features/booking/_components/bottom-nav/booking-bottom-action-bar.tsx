import * as React from 'react';
import { NavLink } from 'react-router';
import { Button, cn } from '~/ui';

export type BottomActionBarActionVariant = 'primary' | 'secondary' | 'ghost';

export type BottomActionBarAction = {
  id: string;
  label: string;
  to?: string;
  icon?: React.ReactNode;
  variant?: BottomActionBarActionVariant;
  disabled?: boolean;
  loading?: boolean;
  type?: 'link' | 'button';
  buttonType?: 'button' | 'submit';
  form?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

type BookingBottomActionBarProps = {
  actions: BottomActionBarAction[];
  visible?: boolean;
  compact?: boolean;
  className?: string;
};

const variantClassByType: Record<BottomActionBarActionVariant, string> = {
  primary: 'bg-interactive text-text-inverse hover:bg-interactive-hover',
  secondary: 'border border-interactive text-interactive hover:bg-surface',
  ghost: 'text-text-primary hover:bg-surface',
};

const activeClassByType: Record<BottomActionBarActionVariant, string> = {
  primary: 'bg-interactive-hover',
  secondary: 'bg-surface',
  ghost: 'bg-surface',
};

export function BookingBottomActionBar({
  actions,
  visible = true,
  compact = false,
  className,
}: BookingBottomActionBarProps) {
  if (!visible || actions.length === 0) {
    return null;
  }

  const boundedActions = actions.slice(0, 4);

  return (
    <>
      <div aria-hidden className="h-8" />
      <div
        className={cn('fixed inset-x-0 bottom-0 z-40 px-3 md:px-4', className)}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--space-sm))' }}
      >
        <div className="mx-auto w-full max-w-3xl md:max-w-5xl">
          <nav
            aria-label="Booking handlinger"
            className={cn('rounded-xl border border-border bg-background p-2 shadow-sm', compact ? 'md:p-2' : 'md:p-3')}
          >
            <div className={cn('grid w-full gap-2', boundedActions.length <= 2 ? 'grid-cols-2' : 'grid-cols-4')}>
              {boundedActions.map((action) => {
                const variant = action.variant ?? 'ghost';
                const actionType = action.type ?? 'link';

                if (actionType === 'button') {
                  return (
                    <Button
                      key={action.id}
                      type={action.buttonType ?? 'button'}
                      variant={variant}
                      size={compact ? 'sm' : 'md'}
                      loading={action.loading}
                      disabled={action.disabled}
                      form={action.form}
                      onClick={action.onClick}
                      className="h-11 w-full"
                    >
                      <span className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2">
                        {action.icon}
                        <span className="truncate text-xs md:text-sm">{action.label}</span>
                      </span>
                    </Button>
                  );
                }

                return (
                  <NavLink
                    key={action.id}
                    to={action.to ?? '#'}
                    aria-disabled={action.disabled}
                    onClick={(event) => {
                      if (action.disabled || action.loading) {
                        event.preventDefault();
                      }
                    }}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex h-11 w-full items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors md:px-3 md:text-sm',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
                        (action.disabled || action.loading) && 'pointer-events-none cursor-not-allowed opacity-50',
                        variantClassByType[variant],
                        isActive && activeClassByType[variant],
                      )
                    }
                  >
                    <span className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2">
                      {action.icon}
                      <span className="truncate">{action.label}</span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
