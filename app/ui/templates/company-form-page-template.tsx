import { Link } from 'react-router';
import { Card, CardContent, CardFooter } from '../organisms/card';
import { CompanyPageTemplate, type CompanyPageTemplateProps } from './company-page-template';

type BackLink = {
  to: string;
  label: string;
};

export interface CompanyFormPageTemplateProps
  extends Omit<CompanyPageTemplateProps, 'children' | 'routeLinks' | 'actions' | 'hero'> {
  backLink?: BackLink | null;
  routeLinks?: React.ReactNode;
  notices?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function CompanyFormPageTemplate({
  backLink,
  routeLinks,
  notices,
  children,
  footer,
  ...props
}: CompanyFormPageTemplateProps) {
  const resolvedRouteLinks =
    backLink || routeLinks ? (
      <>
        {backLink ? (
          <Link
            to={backLink.to}
            className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive"
          >
            {backLink.label}
          </Link>
        ) : null}
        {routeLinks}
      </>
    ) : null;

  return (
    <CompanyPageTemplate {...props} routeLinks={resolvedRouteLinks}>
      {notices}
      <Card variant="default" className="bg-surface">
        <CardContent className="space-y-3">{children}</CardContent>
        {footer ? <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-border">{footer}</CardFooter> : null}
      </Card>
    </CompanyPageTemplate>
  );
}
