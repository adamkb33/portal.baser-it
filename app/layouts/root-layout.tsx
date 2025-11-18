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
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'oklch(var(--chart-1))', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: 'oklch(var(--chart-3))', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'oklch(var(--chart-5))', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'oklch(var(--chart-2))', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'oklch(var(--chart-6))', stopOpacity: 1 }} />
      </linearGradient>
    </defs>

    {/* Flowing wave layers */}
    <path
      fill="url(#grad1)"
      fillOpacity="0.4"
      d="M0 0L320 180L640 0L960 180L1280 0L1600 180L1920 0V400L1600 580L1280 400L960 580L640 400L320 580L0 400Z"
    >
      <animate
        attributeName="d"
        dur="20s"
        repeatCount="indefinite"
        values="
          M0 0L320 180L640 0L960 180L1280 0L1600 180L1920 0V400L1600 580L1280 400L960 580L640 400L320 580L0 400Z;
          M0 60L320 240L640 60L960 240L1280 60L1600 240L1920 60V460L1600 640L1280 460L960 640L640 460L320 640L0 460Z;
          M0 0L320 180L640 0L960 180L1280 0L1600 180L1920 0V400L1600 580L1280 400L960 580L640 400L320 580L0 400Z
        "
      />
    </path>

    <path
      fill="url(#grad2)"
      fillOpacity="0.3"
      d="M0 400L320 580L640 400L960 580L1280 400L1600 580L1920 400V800L1600 980L1280 800L960 980L640 800L320 980L0 800Z"
    >
      <animate
        attributeName="d"
        dur="25s"
        repeatCount="indefinite"
        values="
          M0 400L320 580L640 400L960 580L1280 400L1600 580L1920 400V800L1600 980L1280 800L960 980L640 800L320 980L0 800Z;
          M0 360L320 540L640 360L960 540L1280 360L1600 540L1920 360V760L1600 940L1280 760L960 940L640 760L320 940L0 760Z;
          M0 400L320 580L640 400L960 580L1280 400L1600 580L1920 400V800L1600 980L1280 800L960 980L640 800L320 980L0 800Z
        "
      />
    </path>

    {/* Geometric accent shapes */}
    <g opacity="0.2">
      <circle cx="300" cy="200" r="100" fill="oklch(var(--chart-1))" />
      <circle cx="1600" cy="400" r="150" fill="oklch(var(--chart-3))" />
      <circle cx="800" cy="800" r="120" fill="oklch(var(--chart-5))" />
    </g>

    {/* Subtle grid pattern */}
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(var(--chart-1))" strokeWidth="0.5" opacity="0.3" />
    </pattern>
    <rect width="100%" height="100%" fill="url(#grid)" opacity="0.15" />
  </svg>
);
