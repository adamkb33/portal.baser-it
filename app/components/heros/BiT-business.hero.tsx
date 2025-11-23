import * as React from 'react';
import { cn } from '@/lib/utils';
import BiTLogo from '../logos/BiT.logo';
import { TrendingUp, Users, Clock } from 'lucide-react';
import { ShapesOne } from '../shapes/shapes';

export interface BiTBusinessHeroProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BiTBusinessHero({ className, ...props }: BiTBusinessHeroProps) {
  return (
    <div
      className={cn('relative flex max-w-xl flex-col gap-4 border border-border bg-background p-4', className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-10">
        <ShapesOne />
      </div>

      <div className="space-y-4">
        {/* Brand + signal */}
        <div className="flex items-center justify-between">
          <BiTLogo size="lg" />
          <div className="flex items-center border border-border bg-background px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <TrendingUp className="mr-1 h-3 w-3" />
            Vekst
          </div>
        </div>

        {/* Value prop */}
        <div className="space-y-3">
          <p className="inline-block border border-border bg-background px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-primary">
            Spar 15+ timer i uken
          </p>

          <h2 className="text-2xl font-semibold text-foreground">
            Slutt å <span className="text-primary">kaste bort tid</span> på
            <br />
            administrative oppgaver
          </h2>

          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
            Alt du trenger for å drive bedriften effektivt – timeføring, booking, lønn og CRM – samlet på én plattform.
            Enkel å bruke, umulig å klare seg uten.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 border border-border bg-background p-3">
          <StatItem number="94%" label="Fornøyde kunder" />
          <StatItem number="15t" label="Spart per uke" />
          <StatItem number="24/7" label="Norsk support" />
        </div>

        {/* Benefits + trust */}
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground">
              <span className="inline-block h-4 w-1 bg-primary" />
              Få kontroll på hverdagen
            </h3>

            <ul className="flex flex-col gap-2 text-sm">
              <BenefitItem
                icon={<Clock className="h-4 w-4" />}
                title="Automatiser timeføring"
                benefit="Slutt å jage ansatte for timelister"
              />
              <BenefitItem
                icon={<Users className="h-4 w-4" />}
                title="Kunder booker selv"
                benefit="Svar ikke telefonen 20 ganger om dagen"
              />
            </ul>
          </section>

          <section className="space-y-2 border-t border-border pt-3">
            <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground">
              <span className="inline-block h-4 w-1 bg-primary" />
              Null risiko å komme i gang
            </h3>

            <ul className="flex flex-col gap-1.5 text-sm">
              <TrustPoint>✓ En måned gratis prøveperiode</TrustPoint>
              <TrustPoint>✓ Ferdig oppsett på under 1 time</TrustPoint>
              <TrustPoint>✓ Kanseller når du vil – ingen bindingstid</TrustPoint>
              <TrustPoint>✓ Personlig onboarding inkludert</TrustPoint>
            </ul>
          </section>

          {/* CTA */}
          <div className="space-y-2 pt-3">
            <button
              type="button"
              className="w-full border border-border bg-foreground px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-background"
            >
              Start gratis i dag →
            </button>
            <p className="text-center text-[0.7rem] text-muted-foreground">
              Ingen kredittkort • Klar på 10 minutter • Norsk support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="space-y-0.5 text-center">
      <div className="text-xl font-semibold text-primary">{number}</div>
      <div className="text-[0.7rem] font-medium leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

function BenefitItem({ icon, title, benefit }: { icon: React.ReactNode; title: string; benefit: string }) {
  return (
    <li className="flex items-start gap-2 border border-border bg-background p-2.5 text-sm">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-sm font-semibold text-foreground">{title}</div>
        <div className="text-[0.75rem] leading-snug text-muted-foreground">{benefit}</div>
      </div>
    </li>
  );
}

function TrustPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[0.8rem] font-medium text-foreground">
      <span className="mt-0.5 leading-none">{children}</span>
    </li>
  );
}
