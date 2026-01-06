export function DashWaveBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.12]">
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          background: `
            radial-gradient(circle at 15% 20%, var(--color-primary) 0%, transparent 40%),
            radial-gradient(circle at 85% 30%, var(--color-sidebar-accent) 0%, transparent 35%),
            radial-gradient(circle at 50% 80%, var(--color-sidebar-bg) 0%, transparent 45%),
            radial-gradient(circle at 25% 60%, var(--color-primary) 0%, transparent 30%),
            radial-gradient(circle at 75% 70%, var(--color-sidebar-accent) 0%, transparent 40%),
            radial-gradient(circle at 40% 10%, var(--color-sidebar-bg) 0%, transparent 35%),
            radial-gradient(circle at 90% 85%, var(--color-primary) 0%, transparent 38%)
          `,
        }}
      />
    </div>
  );
}
