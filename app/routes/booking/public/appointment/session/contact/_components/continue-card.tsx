import { LogIn } from 'lucide-react';
import { Form } from 'react-router';
import { Card, CardContent, CardFooter, Text } from '~/ui';

type ContinueCardProps = {
  title: string;
  description?: string;
  cta: string;
  initials?: string;
  intentValue: string;
  isSubmitting?: boolean;
};

export function ContinueCard({ title, description, cta, initials, intentValue, isSubmitting = false }: ContinueCardProps) {
  return (
    <Form method="post" aria-busy={isSubmitting}>
      <button
        type="submit"
        name="intent"
        value={intentValue}
        disabled={isSubmitting}
        className="group w-full rounded-[var(--radius-booking-card)] focus-visible:outline-none focus-visible:ring-[length:var(--border-booking-focus-ring)] focus-visible:ring-booking-action"
      >
        <Card
          variant="interactive"
          size="sm"
          className="cursor-pointer border-booking-border bg-booking-surface transition-colors group-hover:bg-booking-surface-muted group-disabled:cursor-not-allowed group-disabled:opacity-60 group-focus-visible:border-booking-action"
        >
          <CardContent>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center justify-center gap-3">
                {initials ? (
                  <div className="flex size-10 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-surface-muted text-sm font-semibold text-booking-text-muted">
                    {initials}
                  </div>
                ) : null}
                <Text as="h3" variant="heading-sm" className="text-booking-text">
                  {title}
                </Text>
              </div>
              {description ? (
                <Text as="p" variant="body-sm" className="text-booking-text-muted">
                  {description}
                </Text>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <div className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-booking-text">
              <LogIn className="size-5" />
              {isSubmitting ? 'Fortsetter...' : cta}
            </div>
          </CardFooter>
        </Card>
      </button>
    </Form>
  );
}
