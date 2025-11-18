import * as React from 'react';
import { cn } from '@/lib/utils';
import BiTLogo from '../logos/BiT.logo';
import { CheckCircle2, TrendingUp, Users, Clock } from 'lucide-react';
import { ShapesOne } from '../shapes/shapes';

export interface BiTBusinessHeroProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BiTBusinessHero({ className, ...props }: BiTBusinessHeroProps) {
  return (
    <div className={cn('relative flex flex-col gap-4 max-w-xl overflow-hidden', className)} {...props}>
      {/* Background with shapes */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-foreground/40 via-secondary-foreground/25 to-primary/15 rounded-md" />
        <ShapesOne />
      </div>

      {/* Content */}
      <div className="relative p-6 rounded-md backdrop-blur-sm bg-white/20 border border-white/30">
        {/* Brand + Trust Signal */}
        <div className="flex items-center justify-between mb-4">
          <BiTLogo size="lg" />
          <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-white/60 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
          </div>
        </div>

        {/* Value Proposition - Lead with benefit */}
        <div className="space-y-3 mb-6">
          <div className="inline-block">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
              Spar 15+ timer i uken
            </span>
          </div>

          <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
            Slutt å <span className="text-primary">kaste bort tid</span> på <br />
            administrative oppgaver
          </h2>

          <p className="text-sm leading-relaxed text-foreground/90 font-medium">
            Alt du trenger for å drive bedriften effektivt – timeføring, booking, lønn og CRM – samlet på én plattform.
            Enkel å bruke, umulig å klare seg uten.
          </p>
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-3 bg-white/40 rounded-md border border-white/50">
          <StatItem number="94%" label="Fornøyde kunder" />
          <StatItem number="15t" label="Spart per uke" />
          <StatItem number="24/7" label="Norsk support" />
        </div>

        {/* Benefits (not features) - Problem/Solution focused */}
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="text-xs font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
              <span className="inline-block w-1 h-4 bg-primary rounded-full" />
              Få kontroll på hverdagen
            </h3>

            <ul className="flex flex-col gap-2 text-sm">
              <BenefitItem
                icon={<Clock className="w-4 h-4" />}
                title="Automatiser timeføring"
                benefit="Slutt å jage ansatte for timelister"
              />
              <BenefitItem
                icon={<Users className="w-4 h-4" />}
                title="Kunder booker selv"
                benefit="Svar ikke telefonen 20 ganger om dagen"
              />
            </ul>
          </section>

          {/* Why Us - Risk Reversal */}
          <section className="space-y-2 pt-3 border-t-2 border-primary/20">
            <h3 className="text-xs font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
              <span className="inline-block w-1 h-4 bg-primary rounded-full" />
              Null risiko å komme i gang
            </h3>

            <ul className="flex flex-col gap-2 text-sm">
              <TrustPoint>✓ En måned gratis prøveperiode</TrustPoint>
              <TrustPoint>✓ Ferdig oppsett på under 1 time</TrustPoint>
              <TrustPoint>✓ Kanseller når du vil – ingen bindingstid</TrustPoint>
              <TrustPoint>✓ Personlig onboarding inkludert</TrustPoint>
            </ul>
          </section>

          {/* CTA */}
          <div className="pt-4 space-y-2">
            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.02]">
              Start gratis i dag →
            </button>
            <p className="text-xs text-center text-foreground/60">
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
    <div className="text-center">
      <div className="text-xl font-bold text-primary mb-0.5">{number}</div>
      <div className="text-[10px] font-medium text-foreground/70 leading-tight">{label}</div>
    </div>
  );
}

function BenefitItem({ icon, title, benefit }: { icon: React.ReactNode; title: string; benefit: string }) {
  return (
    <li className="group flex items-start gap-2.5 p-2.5 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 border border-primary/10 hover:border-primary/30 hover:shadow-md cursor-pointer">
      <div className="mt-0.5 text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-foreground text-sm mb-0.5">{title}</div>
        <div className="text-xs text-foreground/70 leading-snug">{benefit}</div>
      </div>
    </li>
  );
}

function TrustPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-foreground/90 font-medium hover:text-primary transition-colors">
      <span className="text-sm leading-none mt-0.5">{children}</span>
    </li>
  );
}
