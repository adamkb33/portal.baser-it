export function Footer() {
  return (
    <div
      id="page-footer"
      className="mx-auto flex h-full w-full max-w-[var(--container-xl)] items-center justify-between gap-4 px-[var(--app-shell-inline-padding)] text-xs text-text-secondary"
    >
      <span>© {new Date().getFullYear()} Pitell</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-disabled">Pitell Portal</span>
    </div>
  );
}
