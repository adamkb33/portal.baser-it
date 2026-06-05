import { Loader2 } from 'lucide-react';

export function BookingSessionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Laster booking...</span>
      </div>
    </div>
  );
}
