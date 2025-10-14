import React, { type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { SignInForm, type SignInInput } from '~/components/forms/sign-in-form';

import { MobileNav } from '~/components/layout/mobile-nav';
import { Navbar } from '~/components/layout/navbar';

interface RootLayoutProps {
  children: ReactNode;
}

const SIDEBAR_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/company/settings', label: 'Company settings' },
  { to: '/admin/company/employees', label: 'Employees' },
];

/**
 * Minimal app shell with a static sidebar and main content area.
 */
export function RootLayout({ children }: RootLayoutProps) {
  const showSidebar = SIDEBAR_LINKS.length > 0;

  return (
    <div className="h-screen min-h-dvh flex flex-col bg-white text-zinc-900">
      <header role="banner" className="h-16 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center">
          <Navbar />
        </div>
      </header>

      <main role="main" className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="relative mx-auto w-full max-w-[1200px] flex gap-4 px-4 py-6">
          {showSidebar ? (
            <aside className="hidden lg:block top-6 w-64 h-full">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                <SidebarNav links={SIDEBAR_LINKS} />
              </div>
            </aside>
          ) : null}

          <div className="w-full">
            <SignInForm onSubmit={function (values: SignInInput): void {
              throw new Error('Function not implemented.');
            } }/>
            {children}</div>
        </div>
      </main>

      <footer role="contentinfo" className="hidden h-14 border-t bg-zinc-50 lg:block">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-zinc-600">
          <span>© 2025</span>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
}

function SidebarNav({ links }: { links: Array<{ to: string; label: string }> }) {
  if (!links.length) {
    return (
      <div className="rounded-md border border-dashed border-zinc-200 p-4 text-sm text-zinc-600">
        No sidebar links configured.
      </div>
    );
  }

  return (
    <nav className="space-y-2">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            [
              'block rounded-md px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-zinc-900 text-white shadow' : 'text-zinc-700 hover:bg-zinc-200/70',
            ].join(' ')
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
