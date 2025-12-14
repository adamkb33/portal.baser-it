import * as React from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, type LinksFunction } from 'react-router';
import { Menu, X } from 'lucide-react';
import { Toaster } from 'sonner';

import './app.css';
import { Navbar } from './components/layout/navbar';
import { rootLoader, type RootLoaderLoaderData } from './routes/_features/root.loader';
import { type UserNavigation, RoutePlaceMent } from './lib/route-tree';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { Sidebar } from './routes/_components/sidebar';
import { MobileSidebar } from './routes/_components/mobile-sidebar';

export const loader = rootLoader;

export const links: LinksFunction = () => [
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
  userNav: UserNavigation;
  setUserNav: React.Dispatch<React.SetStateAction<UserNavigation | undefined>>;
  companyContext: CompanySummaryDto | null | undefined;
  setCompanyContext: React.Dispatch<React.SetStateAction<CompanySummaryDto | null | undefined>>;
};

export default function App() {
  const [userNav, setUserNav] = React.useState<UserNavigation | undefined>(undefined);
  const [companyContext, setCompanyContext] = React.useState<CompanySummaryDto | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const data = useLoaderData<RootLoaderLoaderData>();

  React.useEffect(() => {
    setUserNav(data.userNavigation || undefined);
    setCompanyContext(data.companyContext);
  }, [data]);

  const sidebarBranches = userNav?.[RoutePlaceMent.SIDEBAR] || [];
  const hasSidebar = sidebarBranches.length > 0 && companyContext;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-[1200px] flex-col border-x border-border">
        <header role="banner" className="border-b border-border bg-background">
          <div className="flex h-16 w-full items-center gap-3 px-4">
            {hasSidebar && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden border border-border bg-background p-2 rounded-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Navbar navRoutes={userNav} companyContext={companyContext} />
          </div>
        </header>

        <main role="main" className="flex-1 bg-muted relative">
          {hasSidebar && (
            <div className="absolute -left-64">
              <Sidebar branches={sidebarBranches} />
            </div>
          )}
          <div className="flex h-full">
            {hasSidebar && (
              <MobileSidebar
                branches={sidebarBranches}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
              />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col gap-4 px-4 py-6">
              <div className="w-full flex-1">
                <Outlet
                  context={{
                    userNav,
                    setUserNav,
                    companyContext,
                    setCompanyContext,
                  }}
                />
              </div>
              <Toaster />
            </div>
          </div>
        </main>

        <footer
          role="contentinfo"
          className="flex h-12 items-center border-t border-border bg-background text-xs text-muted-foreground"
        >
          <div className="flex w-full items-center px-4">
            <span>© 2025</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
