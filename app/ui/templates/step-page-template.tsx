import { Container } from '../layout/container';
import { Grid } from '../layout/grid';
import { Stack } from '../layout/stack';
import { cn } from '../lib/cn';
import { Panel } from '../organisms/panel';
import { ProgressSteps, type ProgressStepItem } from '../organisms/progress-steps';
import { ActionBar } from '../organisms/action-bar';

export interface StepPageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header: React.ReactNode;
  children: React.ReactNode;
  steps?: ProgressStepItem[];
  summary?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function StepPageTemplate({
  header,
  children,
  steps,
  summary,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: StepPageTemplateProps) {
  return (
    <Container size="lg" className={className} {...props}>
      <Stack space="lg">
        {header}

        {steps?.length ? <ProgressSteps steps={steps} /> : null}

        <Grid columns={summary ? 3 : 1} className={summary ? 'lg:items-start' : undefined}>
          <div className={cn(summary ? 'lg:col-span-2' : 'lg:col-span-3')}>{children}</div>
          {summary ? (
            <Panel as="aside" title="Sammendrag" tone="muted">
              {summary}
            </Panel>
          ) : null}
        </Grid>

        {primaryAction || secondaryAction ? <ActionBar primary={primaryAction} secondary={secondaryAction} /> : null}
      </Stack>
    </Container>
  );
}
