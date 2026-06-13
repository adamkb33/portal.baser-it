import * as React from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  FormField,
  Icon,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  type BadgeVariant,
  type ButtonVariant,
} from '~/ui';

const SOLID_BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'ghost'];
const SOFT_BUTTON_VARIANTS: ButtonVariant[] = ['soft-primary', 'soft-success', 'soft-warning', 'soft-danger', 'soft-info'];
const OUTLINE_BUTTON_VARIANTS: ButtonVariant[] = ['outline-primary', 'outline-success', 'outline-danger', 'ghost'];
const BADGE_VARIANTS: BadgeVariant[] = ['default', 'primary', 'success', 'warning', 'danger', 'info', 'purple', 'solid'];
const TABLE_ROWS = [
  { invoice: 'INV-2026-001', customer: 'Northwind AS', status: 'Paid', statusVariant: 'success', total: '24,800 kr', date: '13 Jun 2026' },
  { invoice: 'INV-2026-002', customer: 'Fjord Digital', status: 'Pending', statusVariant: 'warning', total: '8,450 kr', date: '12 Jun 2026' },
  { invoice: 'INV-2026-003', customer: 'Adminator Labs', status: 'Draft', statusVariant: 'muted', total: '15,200 kr', date: '11 Jun 2026' },
  { invoice: 'INV-2026-004', customer: 'Baser IT', status: 'Failed', statusVariant: 'danger', total: '3,900 kr', date: '10 Jun 2026' },
] satisfies Array<{
  invoice: string;
  customer: string;
  status: string;
  statusVariant: BadgeVariant;
  total: string;
  date: string;
}>;

function Section({
  eyebrow,
  title,
  children,
  className = '',
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-border bg-background p-5 shadow-card ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text-disabled">{eyebrow}</span>
          <h2 className="mt-1 font-display text-lg font-semibold text-text-primary">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function DemoRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function NativeSelect({ disabled = false }: { disabled?: boolean }) {
  return (
    <select
      disabled={disabled}
      className="h-10 w-full rounded-[var(--radius-field)] border border-border bg-background px-3 text-sm text-text-primary transition-colors focus-visible:border-interactive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-50 disabled:cursor-not-allowed disabled:bg-surface-variant-2 disabled:text-text-disabled"
    >
      <option>Owner</option>
      <option>Admin</option>
      <option>Editor</option>
      <option>Viewer</option>
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AlertPreview({
  tone,
  title,
  children,
}: {
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    primary: 'border-blue-200 bg-blue-50 text-interactive',
    success: 'border-green-200 bg-success-soft text-success',
    warning: 'border-amber-200 bg-warning-soft text-warning',
    danger: 'border-red-200 bg-danger-soft text-danger',
    info: 'border-sky-200 bg-info-soft text-info',
  }[tone];

  return (
    <div className={`flex gap-3 rounded-[var(--radius-card)] border p-4 ${toneClasses}`}>
      <Icon name={tone === 'success' ? 'check' : tone === 'danger' ? 'close' : 'ui'} className="mt-0.5 size-4 shrink-0" />
      <div className="text-sm leading-relaxed">
        {title ? <div className="font-semibold text-text-primary">{title}</div> : null}
        <div className="text-text-secondary">{children}</div>
      </div>
    </div>
  );
}

export default function Styleguide() {
  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-background p-5 shadow-card md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-text-disabled">Components - audit</span>
            <h1 className="mt-2 font-display text-3xl font-semibold text-text-primary">Styleguide</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Mirror of the template primitives in <code>buttons.html</code>, <code>ui.html</code>, and <code>forms.html</code>
              using the project UI layer.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Section eyebrow="Style - Solid" title="Filled buttons" className="lg:col-span-12">
            <DemoRow>
              {SOLID_BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </DemoRow>
          </Section>

          <Section eyebrow="Style - Soft" title="Soft / tonal buttons" className="lg:col-span-12">
            <DemoRow>
              {SOFT_BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant.replace('soft-', '')}
                </Button>
              ))}
            </DemoRow>
          </Section>

          <Section eyebrow="Style - Outline" title="Outline buttons" className="lg:col-span-12">
            <DemoRow>
              {OUTLINE_BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant.replace('outline-', '')}
                </Button>
              ))}
            </DemoRow>
          </Section>

          <Section eyebrow="Sizing" title="Three sizes" className="lg:col-span-6">
            <DemoRow>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </DemoRow>
            <div className="mt-3">
              <DemoRow>
                <Button variant="ghost" size="sm">
                  Small
                </Button>
                <Button variant="ghost">Default</Button>
                <Button variant="ghost" size="lg">
                  Large
                </Button>
              </DemoRow>
            </div>
          </Section>

          <Section eyebrow="Icons" title="Leading & trailing" className="lg:col-span-6">
            <DemoRow>
              <Button>
                <Icon name="plus" /> New
              </Button>
              <Button variant="ghost">
                Continue <Icon name="arrow-right" />
              </Button>
              <Button variant="soft-primary">
                <Icon name="plus" /> Add
              </Button>
              <Button size="icon" aria-label="Add">
                <Icon name="plus" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Settings">
                <Icon name="settings" />
              </Button>
            </DemoRow>
          </Section>

          <Section eyebrow="Group" title="Segmented control" className="lg:col-span-6">
            <ButtonGroup>
              <Button variant="ghost" active>
                Day
              </Button>
              <Button variant="ghost">Week</Button>
              <Button variant="ghost">Month</Button>
              <Button variant="ghost">Year</Button>
            </ButtonGroup>
            <div className="mt-4">
              <ButtonGroup>
                <Button variant="ghost" size="icon" aria-label="Bold">
                  <span className="font-display text-sm font-bold">B</span>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Italic">
                  <span className="font-display text-sm italic">I</span>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Underline">
                  <span className="font-display text-sm underline">U</span>
                </Button>
                <Button variant="ghost" size="icon" active aria-label="Link">
                  <Icon name="arrow-right" />
                </Button>
              </ButtonGroup>
            </div>
          </Section>

          <Section eyebrow="State" title="Disabled & loading" className="lg:col-span-6">
            <DemoRow>
              <Button disabled>Disabled</Button>
              <Button variant="ghost" disabled>
                Disabled
              </Button>
              <Button loading>Saving...</Button>
              <Button variant="soft-primary" loading>
                Loading
              </Button>
            </DemoRow>
          </Section>

          <Section eyebrow="Feedback" title="Alerts" className="lg:col-span-12">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <AlertPreview tone="primary" title="New release - v3.1.0">
                Two new components shipped today: segmented controls and tonal buttons.
              </AlertPreview>
              <AlertPreview tone="success" title="All checks passed">
                CI completed with no failing tests.
              </AlertPreview>
              <AlertPreview tone="warning" title="Storage 92% full">
                You are approaching your plan limit.
              </AlertPreview>
              <AlertPreview tone="danger" title="Payment failed">
                Update billing details to continue.
              </AlertPreview>
              <AlertPreview tone="info">Maintenance window scheduled for Saturday 02:00-03:00 UTC.</AlertPreview>
            </div>
          </Section>

          <Section eyebrow="Indicators" title="Badges" className="lg:col-span-6">
            <DemoRow>
              {BADGE_VARIANTS.map((variant) => (
                <Badge key={variant} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </DemoRow>
            <div className="mt-4">
              <DemoRow>
                <Badge variant="primary" dot>
                  Live
                </Badge>
                <Badge variant="success" dot>
                  Online
                </Badge>
                <Badge variant="warning" dot>
                  Idle
                </Badge>
                <Badge variant="danger" dot>
                  Down
                </Badge>
              </DemoRow>
            </div>
          </Section>

          <Section eyebrow="Status" title="Progress bars" className="lg:col-span-6">
            <div className="flex flex-col gap-4">
              {[
                ['Storage', '7.4 / 15 GB', '49%', 'bg-interactive'],
                ['API quota', '82%', '82%', 'bg-warning'],
                ['Failure rate', '3%', '3%', 'bg-danger'],
                ['Profile completion', '100%', '100%', 'bg-success'],
              ].map(([label, value, width, color]) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs text-text-secondary">
                    <span>{label}</span>
                    <strong className="font-mono text-text-primary">{value}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-variant-2">
                    <div className={`h-full rounded-full ${color}`} style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="Tables" title="Basic table" className="lg:col-span-12">
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TABLE_ROWS.map((row) => (
                    <TableRow key={row.invoice}>
                      <TableCell>{row.invoice}</TableCell>
                      <TableCell>{row.customer}</TableCell>
                      <TableCell>
                        <Badge variant={row.statusVariant}>{row.status}</Badge>
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right font-mono text-text-primary">{row.total}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>

          <Section eyebrow="Live example" title="Profile settings" className="lg:col-span-12">
            <div className="mb-4 flex justify-end">
              <Badge variant="solid">DRAFT</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="First name" defaultValue="John" required />
              <FormField label="Last name" defaultValue="Doe" required />
              <div className="md:col-span-2">
                <FormField
                  label="Work email"
                  type="email"
                  defaultValue="john@adminator.app"
                  startIcon={<Icon name="email" />}
                  helperText="Used for sign-in and account notifications."
                />
              </div>
              <Field label="Role">
                <NativeSelect />
              </Field>
              <Field label="Timezone">
                <NativeSelect />
              </Field>
              <Field label="Website">
                <div className="flex">
                  <span className="inline-flex h-10 items-center rounded-l-[var(--radius-field)] border border-r-0 border-border bg-surface-variant-1 px-3 text-sm text-text-secondary">
                    https://
                  </span>
                  <Input className="rounded-l-none" placeholder="yourdomain.com" />
                </div>
              </Field>
              <Field label="Short bio">
                <Textarea defaultValue="Engineering lead. Building admin tools that do not hate their users." />
                <p className="text-xs text-text-secondary">Up to 280 characters. Markdown supported.</p>
              </Field>
            </div>
            <div className="mt-6 border-t border-border-soft pt-5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text-disabled">
                Notifications - 02
              </span>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {['Weekly product updates', 'Mentions and replies', 'Marketing newsletter', 'Two-factor auth reminders'].map(
                  (label, index) => (
                    <label key={label} className="flex items-center gap-3 text-sm text-text-primary">
                      <Checkbox defaultChecked={index !== 2} />
                      {label}
                    </label>
                  ),
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-border-soft pt-5 sm:flex-row sm:items-center">
              <Badge variant="success" dot>
                All changes saved automatically
              </Badge>
              <div className="flex-1" />
              <Button variant="ghost">Cancel</Button>
              <Button>Save profile</Button>
            </div>
          </Section>

          <Section eyebrow="Inputs" title="States" className="lg:col-span-6">
            <div className="flex flex-col gap-3">
              <FormField label="Default" placeholder="Type here" />
              <FormField label="Filled" defaultValue="hello@adminator.app" />
              <FormField label="Disabled" defaultValue="Read only" disabled />
              <FormField label="With icon" startIcon={<Icon name="search" />} placeholder="Search..." />
              <FormField label="Invalid" defaultValue="not-an-email" invalid error="Please enter a valid email address." />
            </div>
          </Section>

          <Section eyebrow="Inputs" title="Select & textarea" className="lg:col-span-6">
            <div className="flex flex-col gap-3">
              <Field label="Country">
                <NativeSelect />
              </Field>
              <Field label="Disabled select">
                <NativeSelect disabled />
              </Field>
              <Field label="Description">
                <Textarea placeholder="Tell us a bit about your project..." />
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
