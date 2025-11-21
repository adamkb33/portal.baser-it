import { type ReactNode } from 'react';

import { Navbar } from '~/components/layout/navbar';
import { type UserNavigation } from '~/lib/route-tree';
import type { CompanySummaryDto } from '~/api/clients/types';
import { Toaster } from 'sonner';

interface RootLayoutProps {
  children: ReactNode;
  routeTree: UserNavigation | undefined;
  companyContext: CompanySummaryDto | null | undefined;
}

export function RootLayout({ children, routeTree, companyContext }: RootLayoutProps) {
  return (
    <>
      {/* Background layer with gradient mesh */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-background" />

        {/* Animated gradient orbs for depth */}
        <div
          className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-chart-1/10 blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-chart-3/8 blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-[20%] left-[30%] w-[70%] h-[70%] rounded-full bg-chart-5/6 blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '4s' }}
        />

        {/* Geometric pattern overlay */}
        <BackgroundPattern className="absolute inset-0 opacity-[0.15]" />
      </div>

      {/* Main content */}
      <div className="relative h-screen min-h-dvh flex flex-col z-10">
        <header
          role="banner"
          className="border-b border-border/50 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 shadow-sm"
        >
          <div className="mx-auto h-16 w-full max-w-[1200px] px-4 flex items-center gap-3">
            <Navbar navRoutes={routeTree} companyContext={companyContext} />
          </div>
        </header>

        <main role="main" className="flex-1 pb-24 lg:pb-0">
          <div className="relative mx-auto w-full max-w-[1200px] flex flex-col gap-4 px-4 py-6 h-full">
            <div className="w-full flex-1">{children}</div>
            <Toaster />
          </div>
        </main>

        <footer
          role="contentinfo"
          className="hidden h-14 border-t border-border/50 bg-card/60 backdrop-blur-sm lg:block"
        >
          <div className="mx-auto h-full w-full max-w-[1200px] px-4 flex items-center text-sm text-muted-foreground">
            <span>© 2025</span>
          </div>
        </footer>
      </div>
    </>
  );
}

const BackgroundPattern = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 1920 1080"
    preserveAspectRatio="xMidYMid slice"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: 'oklch(var(--chart-1))', stopOpacity: 0.9 }} />
        <stop offset="100%" style={{ stopColor: 'oklch(var(--chart-3))', stopOpacity: 0.9 }} />
      </linearGradient>
      <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: 'oklch(var(--chart-2))', stopOpacity: 0.7 }} />
        <stop offset="100%" style={{ stopColor: 'oklch(var(--chart-5))', stopOpacity: 0.7 }} />
      </linearGradient>
    </defs>

    {/* Back wave */}
    <path
      fill="url(#wave1)"
      fillOpacity="0.6"
      d="
        M0,650
        C320,600 640,700 960,650
        C1280,600 1600,700 1920,650
        L1920,1080
        L0,1080
        Z
      "
    />

    {/* Front wave */}
    <path
      fill="url(#wave2)"
      fillOpacity="0.8"
      d="
        M0,720
        C320,680 640,760 960,720
        C1280,680 1600,760 1920,720
        L1920,1080
        L0,1080
        Z
      "
    />
  </svg>
);
