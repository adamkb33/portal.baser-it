import * as React from 'react';
import { Badge, type BadgeVariant, Button, type ButtonVariant, Icon, type IconName, ICONS, Input } from '~/ui/atoms';
import { CardGrid, GridCol } from '~/ui/layout';
import { Card, CardAction, CardHead, KpiCard } from '~/ui/organisms';

const BUTTON_VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'success',
  'warning',
  'danger',
  'info',
  'soft-primary',
  'soft-success',
  'soft-warning',
  'soft-danger',
  'soft-info',
  'outline-primary',
  'outline-success',
  'outline-danger',
];

const BADGE_VARIANTS: BadgeVariant[] = [
  'primary',
  'secondary',
  'outline',
  'muted',
  'success',
  'warning',
  'danger',
  'info',
  'purple',
  'solid',
  'destructive',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-background p-6 shadow-card">
      <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function Styleguide() {
  const iconNames = Object.keys(ICONS) as IconName[];

  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">Design system</span>
          <h1 className="font-display text-3xl font-semibold text-text-primary">Atoms — Phase 2</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Button / Badge / Input variants and the icon registry. Diff against template <code>buttons.html</code> and{' '}
            <code>ui.html</code>.
          </p>
        </header>

        <Section title="Buttons — variants">
          <div className="flex flex-wrap gap-3">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
        </Section>

        <Section title="Buttons — sizes, icon, states">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="ghost" aria-label="Add">
              <Icon name="plus" />
            </Button>
            <Button>
              <Icon name="download" /> With icon
            </Button>
            <Button active>Active</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
            <Badge variant="success" dot>
              live
            </Badge>
            <Badge variant="info" size="sm">
              sm
            </Badge>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="flex max-w-md flex-col gap-3">
            <Input placeholder="Default input" />
            <Input startIcon={<Icon name="search" />} placeholder="With leading icon" />
            <Input invalid placeholder="Invalid state" defaultValue="bad value" />
            <Input disabled placeholder="Disabled" />
            <Input size="lg" placeholder="Large" />
          </div>
        </Section>

        <Section title="KPI cards">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              tone="success"
              icon={<Icon name="appointments" />}
              label="Total visits"
              value="1.24"
              unit="M"
              trend={{ direction: 'up', label: '+10%' }}
              compare={
                <>
                  <Icon name="arrow-right" className="-rotate-45 text-success" size={12} /> up from{' '}
                  <strong className="font-mono text-text-primary">1.12M</strong>
                </>
              }
            />
            <KpiCard
              tone="danger"
              icon={<Icon name="charts" />}
              label="Page views"
              value="4.08"
              unit="M"
              trend={{ direction: 'down', label: '−7%' }}
              compare={
                <>
                  <Icon name="arrow-right" className="rotate-45 text-danger" size={12} /> down from{' '}
                  <strong className="font-mono text-text-primary">4.39M</strong>
                </>
              }
            />
            <KpiCard
              tone="purple"
              icon={<Icon name="user" />}
              label="Unique visitors"
              value="842"
              unit="K"
              trend={{ direction: 'flat', label: '~1%' }}
              compare={<>holding around <strong className="font-mono text-text-primary">835K</strong></>}
            />
            <KpiCard tone="primary" icon={<Icon name="charts" />} label="Bounce rate" value="33" unit="%" />
          </div>
        </Section>

        <Section title="Cards + 12-col grid">
          <CardGrid>
            <GridCol span={8}>
              <Card>
                <CardHead
                  eyebrow="Geography"
                  heading="Site visits"
                  action={
                    <CardAction asChild>
                      <a href="#styleguide">
                        View report <Icon name="arrow-right" />
                      </a>
                    </CardAction>
                  }
                />
                <p className="text-sm text-text-secondary">col-span 8 card body.</p>
              </Card>
            </GridCol>
            <GridCol span={4}>
              <Card>
                <CardHead eyebrow="Personal" heading="Todo list" />
                <p className="text-sm text-text-secondary">col-span 4 card body.</p>
              </Card>
            </GridCol>
          </CardGrid>
        </Section>

        <Section title={`Icons (${iconNames.length})`}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {iconNames.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface p-3 text-center"
              >
                <Icon name={name} size={22} className="text-text-primary" />
                <span className="truncate text-[10px] text-text-secondary" title={name}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
