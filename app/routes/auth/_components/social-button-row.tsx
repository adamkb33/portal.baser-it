import { ENV } from '~/api/config/env';
import { ProviderButtons } from './provider-buttons';
import { cn } from '~/ui';

type SocialButtonRowProps = {
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function SocialButtonRow({ disabled = false, label = 'eller fortsett med', className }: SocialButtonRowProps) {
  if (!ENV.GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-disabled">{label}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="rounded-[var(--radius-control)] border border-border bg-background p-2">
        <ProviderButtons disabled={disabled} showDivider={false} />
      </div>
    </div>
  );
}
