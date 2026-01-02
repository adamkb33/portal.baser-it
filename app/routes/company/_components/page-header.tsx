import * as React from 'react';
import { SimpleShinyBackground } from '~/routes/_components/backgrounds/simple-shiny.background';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

export type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  teaser?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, teaser, actions, children }: PageHeaderProps) {
  const hasDescription = !!description;
  const hasTeaser = !!teaser;

  return (
    <div className="relative overflow-hidden border border-border bg-gradient-to-br from-background via-card/30 to-background rounded shadow-sm mb-6 md:mb-8">
      <SimpleShinyBackground />

      <div className="relative z-10 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-2 md:space-y-3">
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>

                {/* Info popover - only shows if description exists */}
                {hasDescription && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="
                          inline-flex h-6 w-6 items-center justify-center
                          rounded-full
                          text-muted-foreground hover:text-foreground
                          hover:bg-accent/50
                          transition-colors duration-200
                          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                        "
                        aria-label="Mer informasjon"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 md:w-96" align="start" side="bottom">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Om denne siden</h4>
                        <div className="text-sm text-muted-foreground leading-relaxed">{description}</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="h-0.5 md:h-1 w-12 md:w-16 bg-gradient-to-r from-primary via-accent/60 to-secondary rounded-full shadow-2xs" />
            </div>

            {/* Teaser text - short inline description */}
            {hasTeaser && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">{teaser}</p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2 md:gap-3 md:ml-8 md:shrink-0">{actions}</div>}
        </div>

        {children && <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border/50">{children}</div>}
      </div>
    </div>
  );
}
