export function AppShellBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-surface)_72%,var(--color-background))_0%,color-mix(in_oklab,var(--color-background)_90%,white)_38%,color-mix(in_oklab,var(--color-surface)_88%,white)_100%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,color-mix(in_oklab,var(--color-secondary)_16%,transparent)_0%,transparent_36%),radial-gradient(circle_at_84%_18%,color-mix(in_oklab,var(--color-tertiary)_12%,transparent)_0%,transparent_28%)] opacity-90" />

      <div className="absolute -left-24 top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle_at_35%_35%,color-mix(in_oklab,var(--color-secondary)_52%,white)_0%,color-mix(in_oklab,var(--color-secondary)_26%,transparent)_44%,transparent_74%)] opacity-95 blur-3xl md:h-[32rem] md:w-[32rem]" />

      <div className="absolute right-[-6rem] top-[6%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle_at_45%_45%,color-mix(in_oklab,var(--color-tertiary)_46%,white)_0%,color-mix(in_oklab,var(--color-tertiary)_22%,transparent)_48%,transparent_76%)] opacity-90 blur-3xl md:h-[28rem] md:w-[28rem]" />

      <div className="absolute left-[14%] top-[28%] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--color-background)_14%,var(--color-secondary))_0%,transparent_68%)] opacity-60 blur-[88px] md:h-[22rem] md:w-[22rem]" />

      <div className="absolute bottom-[-9rem] left-[14%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--color-interactive)_22%,white)_0%,color-mix(in_oklab,var(--color-secondary)_18%,transparent)_54%,transparent_78%)] opacity-75 blur-3xl md:h-[26rem] md:w-[26rem]" />

      <div className="absolute bottom-[8%] right-[12%] h-[14rem] w-[14rem] rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,color-mix(in_oklab,var(--color-tertiary)_24%,transparent),transparent_42%,color-mix(in_oklab,var(--color-secondary)_24%,transparent),transparent_82%,color-mix(in_oklab,var(--color-tertiary)_24%,transparent))] opacity-60 blur-[72px] md:h-[18rem] md:w-[18rem]" />

      <div className="absolute inset-x-[8%] top-[20%] h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-border)_45%,var(--color-secondary)),transparent)] opacity-80" />
      <div className="absolute inset-x-[18%] top-[56%] h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-border)_58%,var(--color-tertiary)),transparent)] opacity-60" />
      <div className="absolute inset-x-[30%] top-[72%] h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--color-border)_36%,var(--color-interactive)),transparent)] opacity-35" />
    </div>
  );
}
