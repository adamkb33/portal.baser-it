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
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-12">
      {/* Header - Full Width with Navbar (8/12 on desktop, full on mobile) */}
      <header className="border-b border-border bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <nav className="border-b p-2 border-border lg:col-span-8 lg:border-b-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button - only show when sidebar exists */}
            {hasSidebar && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="flex-1">
              <Navbar navRoutes={userNav} companyContext={companyContext} />
            </div>
          </div>
        </nav>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </header>

      {/* Main - Full Width with Section (8/12 on desktop, full on mobile) */}
      <main className="bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        {userNav?.SIDEBAR && (
          <aside className="hidden border-r border-border bg-muted p-4 lg:col-span-2 lg:block">
            <Sidebar branches={userNav?.SIDEBAR} />
          </aside>
        )}

        {/* Mobile Sidebar - Only visible on mobile when open */}
        {hasSidebar && (
          <MobileSidebar branches={sidebarBranches} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        )}

        <section className="overflow-auto p-4 sm:p-5 lg:col-span-8 bg-primary/5 border-r-2">
          <Outlet
            context={{
              userNav,
              setUserNav,
              companyContext,
              setCompanyContext,
            }}
          />
        </section>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </main>

      {/* Footer - Full Width with Section (8/12 on desktop, full on mobile) */}
      <footer className="border-t border-border bg-muted lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <section className="p-2 lg:col-span-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Footer</span>
          <p className="mt-2 text-[0.7rem] text-muted-foreground">Footer content goes here</p>
        </section>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </footer>

      <Toaster />
    </div>
  );
}
