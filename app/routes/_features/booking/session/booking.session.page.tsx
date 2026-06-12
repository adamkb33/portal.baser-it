import { Loader2 } from 'lucide-react';

export function BookingSessionPage() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <div className="flex items-center gap-2 rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised px-4 py-3 shadow-[var(--shadow-booking-card)]">
        <Loader2 className="size-5 animate-spin text-booking-text-muted" />
        <span className="text-sm text-booking-text-muted">Laster booking...</span>
      </div>
    </div>
  );
}
