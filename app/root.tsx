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
      <header className="col-span-1 border-b border-border bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <nav className="border-b border-border p-4 sm:p-5 lg:col-span-8 lg:border-b-0">
          <h2 className="text-sm font-semibold text-foreground">Navbar</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            <li>
              <a href="#" className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
                Link 1
              </a>
            </li>
            <li>
              <a href="#" className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
                Link 2
              </a>
            </li>
            <li>
              <a href="#" className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
                Link 3
              </a>
            </li>
          </ul>
        </nav>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </header>

      {/* Main - Full Width with Section (8/12 on desktop, full on mobile) */}
      <main className="col-span-1 bg-background lg:col-span-12 lg:grid lg:grid-cols-12">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden border-r border-border bg-muted p-4 lg:col-span-2 lg:block">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Menu</span>
          <ul className="mt-3 space-y-2">
            <li>
              <a href="#" className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
                Link 1
              </a>
            </li>
            <li>
              <a href="#" className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
                Link 2
              </a>
            </li>
            <li>
              <a href="#" className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
                Link 3
              </a>
            </li>
          </ul>
        </aside>

        <section className="max-h-full overflow-auto p-4 sm:p-5 lg:col-span-8">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Main Section
              </span>
              <h2 className="mt-2 text-sm font-semibold text-foreground">Section Content</h2>
            </div>

            <div className="border border-border bg-background p-4 sm:p-5">
              <p className="text-sm text-foreground">
                Main content goes here. This follows brutalist design principles with sharp corners, black borders, and
                minimal styling.
              </p>
            </div>
          </div>
        </section>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </main>

      {/* Footer - Full Width with Section (8/12 on desktop, full on mobile) */}
      <footer className="col-span-1 border-t border-border bg-muted lg:col-span-12 lg:grid lg:grid-cols-12">
        <div className="hidden lg:col-span-2 lg:block"></div>

        <section className="p-4 sm:p-5 lg:col-span-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Footer</span>
          <p className="mt-2 text-[0.7rem] text-muted-foreground">Footer content goes here</p>
        </section>

        <div className="hidden lg:col-span-2 lg:block"></div>
      </footer>
    </div>
  );
}
