import { Link } from 'react-router';
import { Button } from '../atoms/button';
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
          <Button asChild variant="outline" size="sm">
            <Link to={backLink.to}>{backLink.label}</Link>
          </Button>
        ) : null}
        {routeLinks}
      </>
    ) : null;

  return (
    <CompanyPageTemplate {...props} routeLinks={resolvedRouteLinks}>
      {notices}
      <Card variant="default">
        <CardContent className="space-y-3">{children}</CardContent>
        {footer ? (
          <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-border">
            {footer}
          </CardFooter>
        ) : null}
      </Card>
    </CompanyPageTemplate>
  );
}
