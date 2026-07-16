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
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
};

type BookingBottomActionBarProps = {
  actions: BottomActionBarAction[];
  visible?: boolean;
  compact?: boolean;
  className?: string;
};

const variantClassByType: Record<BottomActionBarActionVariant, string> = {
  primary: 'bg-booking-action text-booking-action-contrast hover:bg-booking-action-hover',
  secondary:
    'border-[length:var(--border-booking-control)] border-booking-action text-booking-action hover:bg-booking-action-muted',
  ghost: 'text-booking-text hover:bg-booking-surface-muted',
};

const activeClassByType: Record<BottomActionBarActionVariant, string> = {
  primary: 'bg-booking-action-hover',
  secondary: 'bg-booking-action-muted',
  ghost: 'bg-booking-surface-muted',
};

const buttonVariantByType: Record<
  BottomActionBarActionVariant,
  'booking-primary' | 'booking-secondary' | 'booking-ghost'
> = {
  primary: 'booking-primary',
  secondary: 'booking-secondary',
  ghost: 'booking-ghost',
};

const actionControlClass = 'min-h-12 w-full px-2 py-0 text-xs md:min-h-12 md:px-3 md:text-sm';

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
    <div
      data-booking-bottom-action-bar
      className={cn('w-full pt-6', className)}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--space-sm))' }}
    >
      <div className="mx-auto w-full max-w-3xl md:max-w-5xl">
        <nav
          aria-label="Booking handlinger"
          className={cn(
            'rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised p-2 shadow-[var(--shadow-booking-floating)]',
            compact ? 'md:p-2' : 'md:p-3',
          )}
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
                    variant={buttonVariantByType[variant]}
                    size="md"
                    loading={action.loading}
                    disabled={action.disabled}
                    form={action.form}
                    onClick={(event) => {
                      console.info('[booking:client:bottom-action:button-click]', {
                        actionId: action.id,
                        buttonType: action.buttonType ?? 'button',
                        formProp: action.form ?? null,
                        domFormId: event.currentTarget.form?.id ?? null,
                        disabled: Boolean(action.disabled),
                        loading: Boolean(action.loading),
                        defaultPrevented: event.defaultPrevented,
                      });
                      action.onClick?.(event);
                    }}
                    className={actionControlClass}
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
                    action.onClick?.(event);
                    if (action.disabled || action.loading) {
                      event.preventDefault();
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center justify-center rounded-[var(--radius-booking-control)] font-medium transition-colors',
                      actionControlClass,
                      'focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action',
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
  );
}
