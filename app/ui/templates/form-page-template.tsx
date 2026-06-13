import { Link } from 'react-router';
import { type ContainerSize, Container } from '../layout/container';
import { Stack } from '../layout/stack';
import { Card, CardContent, CardFooter, CardHead } from '../organisms/card';
import { Notice } from '../organisms/notice';
import { Text } from '../atoms/text';
import { cn } from '../lib/cn';

export type FormPageTemplateVariant = 'default' | 'subtle' | 'emphasis' | 'airy';

const variantConfig: Record<
  FormPageTemplateVariant,
  {
    cardVariant: React.ComponentProps<typeof Card>['variant'];
    cardSize: React.ComponentProps<typeof Card>['size'];
    headerClassName?: string;
    contentSpace: React.ComponentProps<typeof Stack>['space'];
    footerClassName?: string;
  }
> = {
  default: {
    cardVariant: 'default',
    cardSize: 'lg',
    contentSpace: 'lg',
  },
  subtle: {
    cardVariant: 'subtle',
    cardSize: 'lg',
    contentSpace: 'lg',
  },
  emphasis: {
    cardVariant: 'emphasis',
    cardSize: 'lg',
    contentSpace: 'lg',
  },
  airy: {
    cardVariant: 'subtle',
    cardSize: 'lg',
    headerClassName: 'space-y-2',
    contentSpace: 'xl',
    footerClassName: 'pt-5',
  },
};

export interface FormPageTemplateProps {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string | null;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  footerLink?: {
    to: string;
    label: string;
  } | null;
  size?: ContainerSize;
  variant?: FormPageTemplateVariant;
}

export function FormPageTemplate({
  title,
  description,
  children,
  error,
  actions,
  footer,
  footerLink = { to: '/', label: 'Tilbake til hovedsiden' },
  size = 'md',
  variant = 'subtle',
}: FormPageTemplateProps) {
  const config = variantConfig[variant];

  return (
    <Container size={size}>
      <Card variant={config.cardVariant} size={config.cardSize}>
        <CardHead heading={title} headingAs="h2" className={config.headerClassName}>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {description}
          </Text>
        </CardHead>

        <CardContent>
          <Stack space={config.contentSpace}>
            {error ? <Notice tone="emphasis" message={error} /> : null}
            {children}
          </Stack>
        </CardContent>

        {actions || footer || footerLink ? (
          <CardFooter className={cn('space-y-4', config.footerClassName)}>
            {actions ? <div>{actions}</div> : null}
            {footer ? <div>{footer}</div> : null}
            {footerLink ? (
              <Link
                to={footerLink.to}
                className="block text-center text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
              >
                {footerLink.label}
              </Link>
            ) : null}
          </CardFooter>
        ) : null}
      </Card>
    </Container>
  );
}
