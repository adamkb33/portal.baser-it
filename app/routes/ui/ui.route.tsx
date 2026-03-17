import {
  ActionBar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Cluster,
  Container,
  FieldMessage,
  FormField,
  Grid,
  Inline,
  Input,
  KeyValueList,
  Label,
  Link,
  Notice,
  Panel,
  ProgressSteps,
  SectionHeader,
  SelectionCard,
  Stack,
  StepPageTemplate,
  Text,
  Textarea,
} from '~/ui';
import type { Route } from './+types/ui.route';

export async function loader({}: Route.LoaderArgs) {
  return {};
}

interface CatalogSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function CatalogSection({ id, eyebrow, title, description, children }: CatalogSectionProps) {
  return (
    <section id={id} className="border-t border-border py-16">
      <Container>
        <div className="mb-8 max-w-3xl">
          <Text as="p" variant="overline" className="text-text-secondary">
            {eyebrow}
          </Text>
          <Text as="h2" variant="heading-lg" className="mt-2">
            {title}
          </Text>
          <Text as="p" variant="body" className="mt-3 text-text-secondary">
            {description}
          </Text>
        </div>
        <Stack space="lg">{children}</Stack>
      </Container>
    </section>
  );
}

interface ShowcaseCardProps {
  title: string;
  description?: string;
  variant?: 'default' | 'subtle' | 'emphasis' | 'interactive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function ShowcaseCard({
  title,
  description,
  variant = 'default',
  size = 'md',
  children,
  footer,
}: ShowcaseCardProps) {
  return (
    <Card variant={variant} size={size}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

const progressDemo = [
  { id: 'contact', label: 'Kontakt', status: 'complete' as const },
  { id: 'profile', label: 'Behandler', status: 'current' as const },
  { id: 'time', label: 'Tidspunkt', status: 'upcoming' as const },
  { id: 'confirm', label: 'Bekreft', status: 'upcoming' as const },
];

export default function UIRoute() {
  return (
    <div className="bg-background">
      <section className="border-b border-border py-20">
        <Container>
          <div className="max-w-4xl">
            <Text as="p" variant="overline" className="text-text-secondary">
              UI Route
            </Text>
            <Text as="h1" variant="display" className="mt-3">
              Design System Catalog
            </Text>
            <Text as="p" variant="body-lg" className="mt-4 text-text-secondary">
              This route is the reference surface for the in-house UI system. It now documents the full system shape:
              atoms, molecules, organisms, layout primitives, and templates.
            </Text>
          </div>

          <Grid columns={4} className="mt-10">
            <Card variant="subtle" size="sm">
              <CardHeader>
                <CardTitle>Atoms</CardTitle>
                <CardDescription>Primitive controls and text styles.</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="subtle" size="sm">
              <CardHeader>
                <CardTitle>Molecules</CardTitle>
                <CardDescription>Small compositions of atoms.</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="subtle" size="sm">
              <CardHeader>
                <CardTitle>Organisms</CardTitle>
                <CardDescription>Reusable surfaces and interaction blocks.</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="subtle" size="sm">
              <CardHeader>
                <CardTitle>Layout + Templates</CardTitle>
                <CardDescription>Spatial rules and page shells.</CardDescription>
              </CardHeader>
            </Card>
          </Grid>
        </Container>
      </section>

      <CatalogSection
        id="atoms"
        eyebrow="Layer 1"
        title="Atoms"
        description="Atoms are the smallest reusable visual units. They must stay generic and token-driven."
      >
        <Grid columns={3}>
          <ShowcaseCard title="Typography" description="Approved text variants from the type scale.">
            <Stack space="sm">
              <Text as="p" variant="display">
                Display
              </Text>
              <Text as="p" variant="heading-lg">
                Heading Large
              </Text>
              <Text as="p" variant="heading-md">
                Heading Medium
              </Text>
              <Text as="p" variant="heading-sm">
                Heading Small
              </Text>
              <Text as="p" variant="body">
                Body text for standard application copy.
              </Text>
              <Text as="p" variant="body-sm" className="text-text-secondary">
                Secondary body text for support copy.
              </Text>
              <Text as="p" variant="caption" className="text-text-secondary">
                Caption for metadata and supporting details.
              </Text>
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard title="Buttons" description="Primary, secondary, and ghost actions." variant="emphasis">
            <Stack space="md">
              <Inline wrap space="md">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Inline>
              <Inline wrap space="md">
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button disabled>Disabled</Button>
              </Inline>
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard title="Inputs" description="Field primitives stay minimal and token-backed." variant="subtle">
            <Stack space="md">
              <div>
                <Label htmlFor="ui-demo-input">Input</Label>
                <Input id="ui-demo-input" placeholder="Type here" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="ui-demo-textarea">Textarea</Label>
                <Textarea id="ui-demo-textarea" placeholder="Longer text" className="mt-2" />
              </div>
              <Inline space="md">
                <Checkbox id="ui-demo-checkbox" defaultChecked />
                <Label htmlFor="ui-demo-checkbox">Checkbox</Label>
              </Inline>
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard title="Badges And Links" description="Simple semantic markers and inline actions." variant="interactive">
            <Stack space="md">
              <Cluster space="md">
                <Badge>Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="ghost">Ghost</Badge>
              </Cluster>
              <Text as="p" variant="body-sm">
                Read the <Link href="#molecules">molecule section</Link> for the next composition level.
              </Text>
            </Stack>
          </ShowcaseCard>
        </Grid>
      </CatalogSection>

      <CatalogSection
        id="molecules"
        eyebrow="Layer 2"
        title="Molecules"
        description="Molecules combine a few atoms into repeatable patterns without owning page layout."
      >
        <Grid columns={2}>
          <ShowcaseCard title="FormField" description="Label, control, and validation context in one reusable unit.">
            <div className="max-w-md">
              <Stack space="md">
                <FormField label="Standard field" placeholder="Example input" />
                <FormField
                  label="Field with helper text"
                  helperText="Use helper text for guidance before the user makes a mistake."
                  placeholder="Example input"
                />
                <FormField label="Field with error" error="Dette feltet ma fylles ut." placeholder="Example input" />
              </Stack>
            </div>
          </ShowcaseCard>

          <ShowcaseCard title="SectionHeader And FieldMessage" description="Reusable micro-structures around content." variant="subtle">
            <Stack space="md">
              <SectionHeader
                label="Section"
                title="Section header"
                description="Use this to title a content block or form group without introducing layout-specific wrappers."
                action={
                  <Button variant="ghost" size="sm">
                    Action
                  </Button>
                }
              />
              <Stack space="sm">
                <FieldMessage tone="muted">Muted helper message for passive guidance.</FieldMessage>
                <FieldMessage tone="default">Default message for stronger emphasis.</FieldMessage>
              </Stack>
            </Stack>
          </ShowcaseCard>
        </Grid>
      </CatalogSection>

      <CatalogSection
        id="organisms"
        eyebrow="Layer 3"
        title="Organisms"
        description="Organisms define reusable surfaces, interaction structures, and section patterns."
      >
        <Grid columns={2}>
          <ShowcaseCard title="Card Variants" description="Surface personalities for different levels of emphasis.">
            <Stack space="md">
              <Card variant="default" size="sm">
                <CardHeader>
                  <CardTitle>Default</CardTitle>
                  <CardDescription>Neutral surfaced container.</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="subtle" size="sm">
                <CardHeader>
                  <CardTitle>Subtle</CardTitle>
                  <CardDescription>Quieter block with lower visual weight.</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="emphasis" size="sm">
                <CardHeader>
                  <CardTitle>Emphasis</CardTitle>
                  <CardDescription>Higher priority surfaced content.</CardDescription>
                </CardHeader>
              </Card>
              <Card variant="interactive" size="sm">
                <CardHeader>
                  <CardTitle>Interactive</CardTitle>
                  <CardDescription>Hover-responsive surface for selectable content.</CardDescription>
                </CardHeader>
              </Card>
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard
            title="Panel And Notice"
            description="Use Panel for structured sections, Notice for messaging."
            variant="subtle"
          >
            <Stack space="md">
              <Panel
                title="Panel title"
                description="A panel is a section-level surface with heading structure."
                action={
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                }
              >
                <Text as="p" variant="body-sm" className="text-text-secondary">
                  Panels should replace ad hoc titled containers in route code.
                </Text>
              </Panel>
              <Notice
                title="Notice"
                message="Use notices for passive guidance, empty states, and generic system messaging."
                action={
                  <Button variant="secondary" size="sm">
                    Learn more
                  </Button>
                }
              />
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard title="SelectionCard" description="Generic option selection without business language." variant="interactive">
            <Stack space="md">
              <SelectionCard
                title="Standard option"
                description="A selectable option with title and description."
                meta={
                  <Text as="p" variant="caption" className="text-text-secondary">
                    Additional metadata
                  </Text>
                }
              />
              <SelectionCard
                title="Selected option"
                description="Use the selected state when the choice has been made."
                selected
                trailing={<Badge size="sm">Selected</Badge>}
              />
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard
            title="ProgressSteps, Summary, And Actions"
            description="Shared building blocks for step-based or confirmation flows."
            variant="emphasis"
            footer={
              <ActionBar
                secondary={<Button variant="secondary">Back</Button>}
                primary={<Button>Continue</Button>}
              />
            }
          >
            <Stack space="md">
              <ProgressSteps steps={progressDemo} />
              <KeyValueList
                items={[
                  { label: 'Name', value: 'Ada Lovelace' },
                  { label: 'Email', value: 'ada@example.com' },
                  { label: 'Status', value: 'Confirmed' },
                ]}
              />
            </Stack>
          </ShowcaseCard>
        </Grid>
      </CatalogSection>

      <CatalogSection
        id="layout"
        eyebrow="Layer 4"
        title="Layout Primitives"
        description="Layout primitives are the missing glue layer. Use them to stop rewriting spacing and alignment by hand."
      >
        <Grid columns={2}>
          <ShowcaseCard title="Stack And Inline" description="Vertical rhythm and one-dimensional alignment." variant="subtle">
            <Stack space="md">
              <Card variant="subtle" size="sm">
                <Text as="p" variant="body-sm">
                  Stack item one
                </Text>
              </Card>
              <Card variant="subtle" size="sm">
                <Text as="p" variant="body-sm">
                  Stack item two
                </Text>
              </Card>
              <Inline justify="between">
                <Text as="p" variant="body-sm">
                  Left
                </Text>
                <Text as="p" variant="body-sm">
                  Right
                </Text>
              </Inline>
            </Stack>
          </ShowcaseCard>

          <ShowcaseCard title="Cluster And Grid" description="Wrapped collections and responsive layouts." variant="default">
            <Stack space="md">
              <Cluster>
                <Badge>Alpha</Badge>
                <Badge variant="secondary">Beta</Badge>
                <Badge variant="ghost">Gamma</Badge>
                <Badge>Delta</Badge>
              </Cluster>
              <Grid columns={2} className="gap-3">
                <Card variant="subtle" size="sm">
                  <Text as="p" variant="body-sm">
                    Grid cell 1
                  </Text>
                </Card>
                <Card variant="subtle" size="sm">
                  <Text as="p" variant="body-sm">
                    Grid cell 2
                  </Text>
                </Card>
              </Grid>
            </Stack>
          </ShowcaseCard>
        </Grid>
      </CatalogSection>

      <CatalogSection
        id="templates"
        eyebrow="Layer 5"
        title="Templates"
        description="Templates provide page-level structure only. They should not impose domain-specific presentation."
      >
        <ShowcaseCard
          title="StepPageTemplate"
          description="A generic multi-step shell with header, progress, summary region, and footer actions."
          variant="subtle"
          size="lg"
        >
          <StepPageTemplate
            header={
              <SectionHeader
                label="Template"
                title="Step page template"
                description="The route should provide content and data. The template handles structure."
              />
            }
            steps={progressDemo}
            summary={
              <KeyValueList
                items={[
                  { label: 'Current step', value: 'Profile selection' },
                  { label: 'Next step', value: 'Time selection' },
                ]}
                layout="stacked"
              />
            }
            secondaryAction={<Button variant="secondary">Back</Button>}
            primaryAction={<Button>Continue</Button>}
          >
            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Main content</CardTitle>
                <CardDescription>
                  Templates should work with generic organisms rather than feature-local wrappers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SelectionCard
                  title="Composable option"
                  description="A route can place its own content here without the template forcing a bordered wrapper."
                  selected
                />
              </CardContent>
            </Card>
          </StepPageTemplate>
        </ShowcaseCard>
      </CatalogSection>

      <section className="border-t border-border py-16">
        <Container>
          <ShowcaseCard
            title="System Notes"
            description="Short rules for using this route as the design-system reference."
            variant="emphasis"
          >
            <Grid columns={2}>
              <Notice
                title="Use This Route For"
                message="Checking component states, comparing layer boundaries, and validating whether a new abstraction belongs in app/ui."
              />
              <Notice
                title="Do Not Use This Route For"
                message="Shipping feature-specific UI. If an example starts sounding like booking, auth, or company admin, it belongs outside the shared system."
                tone="emphasis"
              />
            </Grid>
          </ShowcaseCard>
        </Container>
      </section>
    </div>
  );
}
