import React, { type ReactNode } from 'react';
import { Navbar } from '~/components/layout/navbar';

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Minimal app shell: Header / Main / Footer
 * - Header + Footer have fixed heights and span full width
 * - Each section's INNER content is clamped with a max width and horizontal padding
 * - Main area scrolls; content is clamped to a fixed-ish width (via max-width)
 */
export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="h-screen min-h-dvh flex flex-col bg-white text-zinc-900">
      <header role="banner" className="h-16 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center">
          <Navbar />
        </div>
      </header>

      <main role="main" className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6">{children}</div>
      </main>

      <footer role="contentinfo" className="h-14 border-t bg-zinc-50">
        <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-zinc-600">
          <span>© 2025</span>
        </div>
      </footer>
    </div>
  );
}
