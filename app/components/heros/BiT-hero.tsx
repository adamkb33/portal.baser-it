import * as React from 'react';
import { ArrowRight, CircuitBoard, Cloud, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import BiTLogo from '../logos/BiT.logo';

export interface BiTHeroProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function BiTHero({
  className,
  eyebrow = 'Digitalt ingeniørstudio',
  ctaLabel = 'Snakk med oss',
  onCtaClick,
  ...props
}: BiTHeroProps) {
  return (
    <section className={cn('w-full py-12 sm:py-16 lg:py-20', 'text-sm sm:text-base', className)} {...props}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        {/* Logo + eyebrow */}
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-[oklch(0.41_0.12_335)]/6 px-3 py-2 shadow-xs">
            <div className="inline-flex items-center">
              <BiTLogo size="lg" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-muted-foreground">{eyebrow}</span>
              <span className="text-[0.7rem] text-muted-foreground/80">
                Bygger digitale plattformer for neste generasjons virksomheter
              </span>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: text content */}
          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-4">
              <h1 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Smartere dataflyt.
                <br className="hidden sm:inline" />
                <span className="text-[oklch(0.41_0.12_335)]"> Raskere leveranser.</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                BiT hjelper moderne virksomheter med å designe, bygge og drifte digitale plattformer som kobler sammen
                data, produkter og mennesker – fra første prototype til skalerbar produksjon.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-[oklch(0.41_0.12_335)]" />
                  Skalerbare plattformer
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-[oklch(0.41_0.12_335)]/70" />
                  Sky-native arkitektur
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-[oklch(0.41_0.12_335)]/40" />
                  Tverrfaglige produktteam
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onCtaClick}
                  className={cn('inline-flex items-center gap-2 rounded-full px-5', 'text-sm font-medium')}
                >
                  {ctaLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right: services / overview */}
          <div className="flex-1 lg:max-w-md">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ServiceItem
                icon={<CircuitBoard className="size-4" aria-hidden="true" />}
                title="Dataplattformer & integrasjoner"
                description="Vi samler systemene dine i én robust dataplattform, med rene grensesnitt og tydelige datamodeller."
              />
              <ServiceItem
                icon={<Cloud className="size-4" aria-hidden="true" />}
                title="Sky- og backendutvikling"
                description="Moderne, sikre tjenester i skyen – bygget med fokus på ytelse, observabilitet og drift."
              />
              <ServiceItem
                icon={<Users className="size-4" aria-hidden="true" />}
                title="Produktteam on-demand"
                description="Tverrfaglige team som tar ideen din fra skisse til produksjon, med kontinuerlige leveranser."
              />
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              BiT kombinerer produktdesign, utvikling og arkitektur for å hjelpe deg med å levere raskere – uten å
              kompromisse på kvalitet, sikkerhet eller skalerbarhet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ServiceItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

function ServiceItem({ icon, title, description, className, ...props }: ServiceItemProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl bg-card/40 p-4 shadow-2xs backdrop-blur-sm',
        'transition-transform duration-200 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon && (
          <span className="inline-flex items-center justify-center rounded-full bg-[oklch(0.41_0.12_335)]/10 p-1">
            {icon}
          </span>
        )}
        <span className="uppercase tracking-[0.16em] text-[0.7rem]">Tjeneste</span>
      </div>
      <h2 className="text-sm font-semibold text-foreground sm:text-base">{title}</h2>
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
    </div>
  );
}
