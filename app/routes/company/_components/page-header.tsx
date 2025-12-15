import * as React from 'react';

export type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="border border-border bg-background rounded-none overflow-hidden relative">
      {/* Minimal geometric shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right small triangle */}
        <div
          className="absolute -top-4 -right-4"
          style={{
            width: '120px',
            height: '120px',
            background: 'oklch(0.48 0.23 330 / 0.06)',
            clipPath: 'polygon(100% 0, 100% 100%, 60% 0)',
          }}
        />

        {/* Bottom-left parallelogram */}
        <div
          className="absolute -bottom-2 -left-6"
          style={{
            width: '90px',
            height: '50px',
            background: 'oklch(0.48 0.23 330 / 0.08)',
            transform: 'skewX(-20deg)',
          }}
        />

        {/* Accent line */}
        <div
          className="absolute top-1/2 right-0"
          style={{
            width: '140px',
            height: '1px',
            background: 'oklch(0.48 0.23 330 / 0.15)',
            transform: 'rotate(-25deg) translateY(-50%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 flex-1">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {children && <div className="border-t border-border pt-4">{children}</div>}
      </div>
    </div>
  );
}
