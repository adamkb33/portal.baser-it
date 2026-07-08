import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { Button, Inline, Stack, Text } from '~/ui';

const benefits = ['Automatisk booking 24/7', 'Integrert fakturering og rapportering', 'Mobilapp for ansatte og kunder'];

export default function RootPageHero() {
  return (
    <section className="relative lg:col-span-12">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Stack space="lg">
          <Stack space="md">
            <Text as="h1" variant="display" className="max-w-3xl">
              Bedriftenes svar på <span className="text-primary">administrative systemer</span>
            </Text>

            <Text as="p" variant="body-lg" className="max-w-xl text-text-secondary">
              Effektiviser booking, timeplanlegging og kundeadministrasjon på ett sted. Spar tid, reduser feil, og
              fokuser på det som virkelig betyr noe.
            </Text>
          </Stack>

          <ul className="space-y-2 p-0">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <Inline space="xs" align="center">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
                  <Text as="span" variant="body" className="text-text-primary">
                    {benefit}
                  </Text>
                </Inline>
              </li>
            ))}
          </ul>

          <Inline space="sm" wrap>
            <Button size="lg">
              Ta kontakt med salg
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button size="lg" variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Se demo
            </Button>
          </Inline>
        </Stack>

        <div className="relative h-[var(--spacing-hero-media-block-mobile)] overflow-hidden rounded-lg border border-border bg-surface shadow-lg lg:h-[var(--spacing-hero-media-block-desktop)]">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop"
            alt="Team collaborating on business solutions"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-surface/90 p-4 backdrop-blur-sm">
            <Inline justify="between" align="center" space="md">
              <div>
                <Text as="p" variant="caption" className="text-text-secondary">
                  Aktiv arbeidsflyt
                </Text>
                <Text as="p" variant="body-sm" className="font-semibold">
                  Booking, kunder og timer samlet
                </Text>
              </div>
              <span className="rounded-full bg-surface-secondary-strong px-3 py-1 text-xs font-semibold text-secondary">
                Live
              </span>
            </Inline>
          </div>
        </div>
      </div>
    </section>
  );
}
