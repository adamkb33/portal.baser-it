import { Text } from '../atoms/text';
import { cn } from '../lib/cn';

export interface SelectionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  selected?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function SelectionCard({
  title,
  description,
  meta,
  selected = false,
  leading,
  trailing,
  className,
  disabled,
  type = 'button',
  ...props
}: SelectionCardProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex w-full flex-col gap-4 rounded-md border p-4 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
        selected ? 'border-interactive bg-surface' : 'border-border bg-background hover:bg-surface',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      aria-pressed={selected}
      disabled={disabled}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <div className="min-w-0 space-y-1">
            <Text as="span" variant="heading-sm" className="block">
              {title}
            </Text>
            {description ? (
              <Text as="span" variant="body-sm" className="block text-text-secondary">
                {description}
              </Text>
            ) : null}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {meta ? <div>{meta}</div> : null}
    </button>
  );
}
