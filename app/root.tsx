import * as React from 'react';
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useOutletContext,
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';
import { RootLayout } from './layouts/root-layout';
import { rootLoader, type RootLoaderLoaderData } from './features/auth/api/root.server';
import type { BrachCategory, BranchGroup, RouteBranch } from './lib/nav/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/identity';

export const loader = rootLoader;

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export type RootOutletContext = {
  userNav: RouteBranch[];
  setUserNav: React.Dispatch<React.SetStateAction<RouteBranch[]>>;
  companyContext: CompanySummaryDto | null | undefined;
  setCompanyContext: React.Dispatch<React.SetStateAction<CompanySummaryDto | null | undefined>>;
};

export default function App() {
  const [userNav, setUserNav] = React.useState<Record<BrachCategory, BranchGroup> | undefined>(undefined);
  const [companyContext, setCompanyContext] = React.useState<CompanySummaryDto | null | undefined>(undefined);
  const data = useLoaderData<RootLoaderLoaderData>();

  React.useEffect(() => {
    setUserNav(data.userNavigation || undefined);
    setCompanyContext(data.companyContext);
  }, [data]);

  return (
    <RootLayout routeTree={userNav} companyContext={companyContext}>
      <Outlet
        context={{
          userNav,
          setUserNav,
          companyContext,
          setCompanyContext,
        }}
      />
    </RootLayout>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      <Link to={'/'}>Tilbake til hjemmesiden</Link>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
