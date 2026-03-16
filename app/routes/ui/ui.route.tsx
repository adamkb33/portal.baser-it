import { Text, Button, Input, Label, Badge, Link, Checkbox, FormField, cn } from '~/ui';
import type { Route } from './+types/ui.route';

export async function loader({}: Route.LoaderArgs) {
  return {};
}

interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function ComponentShowcase({ title, description, children }: ComponentShowcaseProps) {
  return (
    <section className="py-16 border-b border-border">
      <div className="max-w-container-xl mx-auto px-6 md:px-8">
        <div className="mb-8">
          <Text as="h2" variant="heading-md">
            {title}
          </Text>
          {description && (
            <Text as="p" variant="body-sm" className="text-text-secondary mt-2">
              {description}
            </Text>
          )}
        </div>
        <div className="grid gap-8 bg-surface p-8 rounded-md border border-border">{children}</div>
      </div>
    </section>
  );
}

interface VariantGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

function VariantGrid({ children, columns = 3 }: VariantGridProps) {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return <div className={cn('grid gap-4', gridClass)}>{children}</div>;
}

export default function UIRoute() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-background border-b border-border">
        <div className="max-w-container-xl mx-auto px-6 md:px-8">
          <Text as="h1" variant="display" className="mb-4">
            Design System Showcase
          </Text>
          <Text as="p" variant="body-lg" className="text-text-secondary max-w-2xl">
            A comprehensive showcase of all atomic design components. Built with zero-variance principles and
            token-based styling.
          </Text>
        </div>
      </section>

      {/* Typography */}
      <ComponentShowcase
        title="Typography"
        description="All semantic text variants with consistent sizing, weight, and leading."
      >
        <div className="space-y-4">
          <div>
            <Text as="p" variant="display">
              Display (48px / semibold / tight)
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary mt-1">
              Hero headlines, page titles
            </Text>
          </div>

          <div>
            <Text as="p" variant="heading-lg">
              Heading Large (30px / semibold / tight)
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary mt-1">
              Section headings
            </Text>
          </div>

          <div>
            <Text as="p" variant="heading-md">
              Heading Medium (24px / semibold / snug)
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary mt-1">
              Card headings, modal titles
            </Text>
          </div>

          <div>
            <Text as="p" variant="heading-sm">
              Heading Small (20px / medium / snug)
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary mt-1">
              Sub-headings
            </Text>
          </div>

          <div>
            <Text as="p" variant="body-lg">
              Body Large (18px / regular / relaxed)
            </Text>
            <Text as="p" variant="body-sm" className="text-text-secondary mt-1">
              Lead paragraphs
            </Text>
          </div>

          <div>
            <Text as="p" variant="body">
              Body (16px / regular / normal) - All body copy
            </Text>
          </div>

          <div>
            <Text as="p" variant="body-sm">
              Body Small (14px / regular / normal) - Secondary copy, descriptions
            </Text>
          </div>

          <div>
            <Text as="p" variant="label">
              Label (14px / medium / normal / wide) - Form labels, tags, table headers
            </Text>
          </div>

          <div>
            <Text as="p" variant="caption">
              Caption (12px / regular / normal / wide) - Metadata, timestamps, footnotes
            </Text>
          </div>

          <div>
            <Text as="p" variant="overline">
              Overline (12px / medium / normal / widest) - Section eyebrows, category labels
            </Text>
          </div>
        </div>
      </ComponentShowcase>

      {/* Buttons */}
      <ComponentShowcase
        title="Button"
        description="Interactive button component with three variants and three sizes. Includes focus rings and hover transitions."
      >
        <div className="space-y-8">
          {/* Primary Variant */}
          <div>
            <Text as="p" variant="label" className="mb-4">
              Primary Variant
            </Text>
            <VariantGrid columns={3}>
              <div className="flex flex-col gap-2 items-start">
                <Button size="sm">Small</Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  sm
                </Text>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Button size="md">Medium</Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  md
                </Text>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Button size="lg">Large</Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  lg
                </Text>
              </div>
            </VariantGrid>
          </div>

          {/* Secondary Variant */}
          <div>
            <Text as="p" variant="label" className="mb-4">
              Secondary Variant
            </Text>
            <VariantGrid columns={3}>
              <div className="flex flex-col gap-2 items-start">
                <Button variant="secondary" size="sm">
                  Small
                </Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  sm
                </Text>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Button variant="secondary" size="md">
                  Medium
                </Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  md
                </Text>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Button variant="secondary" size="lg">
                  Large
                </Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  lg
                </Text>
              </div>
            </VariantGrid>
          </div>

          {/* Ghost Variant */}
          <div>
            <Text as="p" variant="label" className="mb-4">
              Ghost Variant
            </Text>
            <VariantGrid columns={3}>
              <div className="flex flex-col gap-2 items-start">
                <Button variant="ghost" size="sm">
                  Small
                </Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  sm
                </Text>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Button variant="ghost" size="md">
                  Medium
                </Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  md
                </Text>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <Button variant="ghost" size="lg">
                  Large
                </Button>
                <Text as="p" variant="caption" className="text-text-secondary">
                  lg
                </Text>
              </div>
            </VariantGrid>
          </div>

          {/* Disabled State */}
          <div>
            <Text as="p" variant="label" className="mb-4">
              Disabled State
            </Text>
            <VariantGrid columns={3}>
              <Button disabled>Primary Disabled</Button>
              <Button variant="secondary" disabled>
                Secondary Disabled
              </Button>
              <Button variant="ghost" disabled>
                Ghost Disabled
              </Button>
            </VariantGrid>
          </div>
        </div>
      </ComponentShowcase>

      {/* Input */}
      <ComponentShowcase
        title="Input"
        description="Form input element with three sizes and disabled state. Includes focus rings and border tokens."
      >
        <div className="space-y-6">
          <div>
            <Text as="p" variant="label" className="mb-4">
              Sizes
            </Text>
            <VariantGrid columns={3}>
              <div className="flex flex-col gap-2">
                <Input size="sm" placeholder="Small input" />
                <Text as="p" variant="caption" className="text-text-secondary">
                  sm
                </Text>
              </div>
              <div className="flex flex-col gap-2">
                <Input size="md" placeholder="Medium input" />
                <Text as="p" variant="caption" className="text-text-secondary">
                  md
                </Text>
              </div>
              <div className="flex flex-col gap-2">
                <Input size="lg" placeholder="Large input" />
                <Text as="p" variant="caption" className="text-text-secondary">
                  lg
                </Text>
              </div>
            </VariantGrid>
          </div>

          <div>
            <Text as="p" variant="label" className="mb-4">
              Disabled State
            </Text>
            <Input placeholder="Disabled input" disabled />
          </div>
        </div>
      </ComponentShowcase>

      {/* Label */}
      <ComponentShowcase
        title="Label"
        description="Form label with semantic styling. Always paired with form controls."
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="demo-input">Form Label Example</Label>
            <Input id="demo-input" placeholder="Associated input" className="mt-2" />
          </div>
        </div>
      </ComponentShowcase>

      {/* Badge */}
      <ComponentShowcase
        title="Badge"
        description="Small labeling component with three variants and two sizes."
      >
        <div className="space-y-6">
          <div>
            <Text as="p" variant="label" className="mb-4">
              Primary Variant
            </Text>
            <VariantGrid columns={2}>
              <Badge size="sm">Small Badge</Badge>
              <Badge size="md">Medium Badge</Badge>
            </VariantGrid>
          </div>

          <div>
            <Text as="p" variant="label" className="mb-4">
              Secondary Variant
            </Text>
            <VariantGrid columns={2}>
              <Badge variant="secondary" size="sm">
                Small Badge
              </Badge>
              <Badge variant="secondary" size="md">
                Medium Badge
              </Badge>
            </VariantGrid>
          </div>

          <div>
            <Text as="p" variant="label" className="mb-4">
              Ghost Variant
            </Text>
            <VariantGrid columns={2}>
              <Badge variant="ghost" size="sm">
                Small Badge
              </Badge>
              <Badge variant="ghost" size="md">
                Medium Badge
              </Badge>
            </VariantGrid>
          </div>
        </div>
      </ComponentShowcase>

      {/* Link */}
      <ComponentShowcase
        title="Link"
        description="Semantic link component with underline, focus ring, and hover transitions."
      >
        <div>
          <Text as="p" variant="body">
            This is a <Link href="#">inline link</Link> within body text. Links are always underlined and use
            interactive color token.
          </Text>
        </div>
      </ComponentShowcase>

      {/* Checkbox */}
      <ComponentShowcase
        title="Checkbox"
        description="Accessible checkbox input with focus ring and interactive styling."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox id="demo-checkbox" />
            <Label htmlFor="demo-checkbox">Unchecked checkbox</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="demo-checkbox-checked" defaultChecked />
            <Label htmlFor="demo-checkbox-checked">Checked checkbox</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="demo-checkbox-disabled" disabled />
            <Label htmlFor="demo-checkbox-disabled">Disabled checkbox</Label>
          </div>
        </div>
      </ComponentShowcase>

      {/* FormField Molecule */}
      <ComponentShowcase
        title="FormField (Molecule)"
        description="Composition of Label + Input with optional error and helper text."
      >
        <div className="space-y-6 max-w-md">
          <FormField label="Standard Field" placeholder="Enter text here" />

          <FormField label="Field with Helper Text" helper-text="This is helper text" placeholder="Enter text here" />

          <FormField label="Field with Error" error="This field is required" placeholder="Enter text here" />
        </div>
      </ComponentShowcase>

      {/* Color Tokens */}
      <ComponentShowcase
        title="Color Tokens"
        description="Monochrome palette with semantic color aliases for consistent visual language."
      >
        <div className="space-y-8">
          <div>
            <Text as="p" variant="label" className="mb-4">
              Semantic Colors
            </Text>
            <VariantGrid columns={4}>
              <div>
                <div className="h-24 bg-background border-2 border-border rounded-md mb-2" />
                <Text as="p" variant="caption">background</Text>
              </div>
              <div>
                <div className="h-24 bg-surface border-2 border-border rounded-md mb-2" />
                <Text as="p" variant="caption">surface</Text>
              </div>
              <div>
                <div className="h-24 bg-border border-2 border-border rounded-md mb-2" />
                <Text as="p" variant="caption">border</Text>
              </div>
              <div>
                <div className="h-24 bg-text-primary rounded-md mb-2" />
                <Text as="p" variant="caption">text-primary</Text>
              </div>
            </VariantGrid>
          </div>

          <div>
            <Text as="p" variant="label" className="mb-4">
              Grayscale
            </Text>
            <VariantGrid columns={4}>
              <div>
                <div className="h-16 bg-gray-950 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-950</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-900 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-900</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-800 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-800</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-700 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-700</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-600 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-600</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-500 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-500</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-400 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-400</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-300 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-300</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-200 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-200</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-100 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-100</Text>
              </div>
              <div>
                <div className="h-16 bg-gray-50 rounded-md mb-2" />
                <Text as="p" variant="caption">gray-50</Text>
              </div>
              <div>
                <div className="h-16 bg-white rounded-md border-2 border-border mb-2" />
                <Text as="p" variant="caption">white</Text>
              </div>
            </VariantGrid>
          </div>
        </div>
      </ComponentShowcase>

      {/* Spacing Scale */}
      <ComponentShowcase
        title="Spacing Scale"
        description="4px base unit with consistent multiples. All margins, padding, and gaps use these tokens."
      >
        <div className="space-y-4">
          {[
            { name: 'spacing-1', value: '4px' },
            { name: 'spacing-2', value: '8px' },
            { name: 'spacing-3', value: '12px' },
            { name: 'spacing-4', value: '16px' },
            { name: 'spacing-6', value: '24px' },
            { name: 'spacing-8', value: '32px' },
          ].map(({ name, value }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="w-32">
                <Text as="p" variant="caption" className="font-mono">
                  {name}
                </Text>
              </div>
              <div className="h-8 bg-interactive rounded-sm" style={{ width: value }} />
              <Text as="p" variant="caption">{value}</Text>
            </div>
          ))}
        </div>
      </ComponentShowcase>

      {/* Border Radius */}
      <ComponentShowcase
        title="Border Radius"
        description="Consistent border radius mapping by component type."
      >
        <VariantGrid columns={4}>
          <div className="flex flex-col gap-2 items-center">
            <div className="w-20 h-20 bg-surface border border-border rounded-none" />
            <Text as="p" variant="caption">radius-none</Text>
            <Text as="p" variant="caption" className="text-text-secondary">
              0px
            </Text>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="w-20 h-20 bg-surface border border-border rounded-sm" />
            <Text as="p" variant="caption">radius-sm</Text>
            <Text as="p" variant="caption" className="text-text-secondary">
              4px
            </Text>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="w-20 h-20 bg-surface border border-border rounded-md" />
            <Text as="p" variant="caption">radius-md</Text>
            <Text as="p" variant="caption" className="text-text-secondary">
              8px
            </Text>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="w-20 h-20 bg-surface border border-border rounded-full" />
            <Text as="p" variant="caption">radius-full</Text>
            <Text as="p" variant="caption" className="text-text-secondary">
              9999px
            </Text>
          </div>
        </VariantGrid>
      </ComponentShowcase>

      {/* Design Principles */}
      <section className="py-16 bg-surface">
        <div className="max-w-container-xl mx-auto px-6 md:px-8">
          <Text as="h2" variant="heading-md" className="mb-8">
            Design Principles
          </Text>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Zero Variance',
                description: 'Every visual decision is made once and applied consistently everywhere.',
              },
              {
                title: 'Token-Based',
                description: 'All values map to design tokens. No arbitrary values or one-off styles.',
              },
              {
                title: 'Atomic Design',
                description: 'Components follow strict atomic hierarchy: atoms → molecules → organisms → pages.',
              },
              {
                title: 'Monochrome Only',
                description: 'Pure grayscale palette. No accent colors. States shown through text and icons.',
              },
              {
                title: 'Minimal Motion',
                description: 'Transitions confirm interactions. Respects prefers-reduced-motion.',
              },
              {
                title: 'Clean & Clear',
                description: 'Whitespace is structure. No decorative elements. Function over form.',
              },
            ].map((principle) => (
              <div key={principle.title} className="bg-background p-6 rounded-md border border-border">
                <Text as="p" variant="label" className="mb-2">
                  {principle.title}
                </Text>
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  {principle.description}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
