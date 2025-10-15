import React, { type ReactNode } from 'react';
import { NavLink } from 'react-router';

import { MobileMenu } from '~/components/layout/mobile-menu';
import { MobileNav } from '~/components/layout/mobile-nav';
import { Navbar } from '~/components/layout/navbar';
import { createNavigationSections, type NavigationSections } from '~/lib/navigation';
import { loadAuthTokens, withTokenListener } from '~/features/auth/token/token-storage';
import type { AuthTokens } from '~/features/auth/token/types';
import { tokensToAuthenticatedPayload } from '~/features/auth/token/token-payload';
import type { NavItem } from '~/lib/navigation/functions';
import { SidebarNav } from '~/components/layout/sidebar';
import { NavBreadcrumbs } from '~/components/layout/nav-breadcrums';

interface RootLayoutProps {
  children: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const [navigation, setNavigation] = React.useState<NavigationSections>(() => createNavigationSections());

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateNavigation = (tokens?: AuthTokens | null) => {
      const source = tokens ?? loadAuthTokens();
      const payload = tokensToAuthenticatedPayload(source);
      setNavigation(createNavigationSections({ payload }));
    };

    updateNavigation(loadAuthTokens());

    const unsubscribe = withTokenListener((nextTokens) => {
      updateNavigation(nextTokens);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [setNavigation, loadAuthTokens, tokensToAuthenticatedPayload, createNavigationSections]);

  const sidebarItems = navigation.sidebar;
  const showSidebar = sidebarItems.length > 0;

  const mobileMenuItems = React.useMemo(
    () =>
      dedupeNavItems([
        navigation.navbar.start,
        navigation.navbar.middle,
        navigation.navbar.end,
        navigation.account,
        navigation.sidebar,
      ]),
    [navigation],
  );

  const mobileNavItems = React.useMemo(() => {
    if (sidebarItems.length) {
      return flattenNavItems(sidebarItems).slice(0, 4);
    }
    return mobileMenuItems.slice(0, 4);
  }, [mobileMenuItems, sidebarItems]);

  return (
    <div className="h-screen min-h-dvh flex flex-col bg-white text-zinc-900">
      <header role="banner" className="h-16 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center gap-3">
          <Navbar sections={navigation.navbar} accountItems={navigation.account} />
          <MobileMenu items={mobileMenuItems} />
        </div>
      </header>

      <main role="main" className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <div className="relative mx-auto w-full max-w-[1200px] flex gap-4 px-4 py-6">
          {showSidebar ? (
            <aside className="hidden lg:block top-6 w-64 h-full">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                <SidebarNav items={sidebarItems} />
              </div>
            </aside>
          ) : null}
          <div className="flex flex-col w-full">
            <NavBreadcrumbs items={sidebarItems} />
            <div className="w-full ">{children}</div>
          </div>
        </div>
      </main>

      <footer role="contentinfo" className="hidden h-14 border-t bg-zinc-50 lg:block">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-zinc-600">
          <span>© 2025</span>
        </div>
      </footer>

      <MobileNav items={mobileNavItems} />
    </div>
  );
}

function dedupeNavItems(groups: NavItem[][]): NavItem[] {
  const seen = new Set<string>();
  const flattened: NavItem[] = [];

  const push = (item: NavItem) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      flattened.push(item);
    }
    item.children?.forEach(push);
  };

  for (const group of groups) {
    for (const item of group) {
      push(item);
    }
  }

  return flattened;
}

function flattenNavItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];
  const seen = new Set<string>();

  const visit = (item: NavItem) => {
    if (!seen.has(item.href)) {
      seen.add(item.href);
      result.push(item);
    }
    item.children?.forEach(visit);
  };

  items.forEach(visit);
  return result;
}
