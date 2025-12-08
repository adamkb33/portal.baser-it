interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="border border-border p-4 mb-4 bg-destructive/10">
      <div className="flex-1 space-y-1">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Feil</div>
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
