import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronLeft, X } from 'lucide-react';
import { Button, cn, Sheet, SheetContent, SheetTitle } from '~/ui';
import type { RouteBranch } from '~/lib/route-tree';

type MobileSidebarProps = {
  branches: RouteBranch[];
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ branches, isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const visibleBranches = React.useMemo(() => filterVisibleBranches(branches), [branches]);
  const activeTrail = React.useMemo(() => findTrail(visibleBranches, location.pathname), [visibleBranches, location.pathname]);
  const defaultFocusedSectionId =
    [...activeTrail].reverse().find((entry) => entry.node.children && entry.node.children.length > 0)?.node.id ??
    visibleBranches[0]?.id ??
    null;
  const [focusedSectionId, setFocusedSectionId] = React.useState<string | null>(defaultFocusedSectionId);

  React.useEffect(() => {
    setFocusedSectionId(defaultFocusedSectionId);
  }, [defaultFocusedSectionId]);

  if (visibleBranches.length === 0) {
    return null;
  }

  const focusedSection = focusedSectionId ? findNodeWithParent(visibleBranches, focusedSectionId) : null;
  const currentSection = focusedSection?.node ?? visibleBranches[0];
  const parentSection = focusedSection?.parent ?? null;
  const items = currentSection.children ?? [];
  const activeNode = activeTrail.at(-1)?.node ?? null;
  const activeParent = activeTrail.length > 1 ? activeTrail.at(-2)?.node ?? null : null;
  const backTarget = activeNode && activeNode.id !== currentSection.id ? activeParent : parentSection;
  const isSectionActive = activeNode?.id === currentSection.id;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="z-50 w-[78vw] max-w-[20rem] border-l border-sidebar-border bg-overlay-surface p-0 text-sidebar-text shadow-2xl lg:hidden [&>[data-slot=sheet-close]]:hidden"
      >
        <div className="flex h-full flex-col bg-overlay-surface">
          <div className="border-b border-sidebar-border bg-sidebar-accent/10 px-4 py-4 pr-12">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-sidebar-text-muted">Meny</p>
            <SheetTitle className="sr-only">Navigasjonsmeny</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-3 top-3 h-8 w-8 text-sidebar-text-muted hover:bg-sidebar-accent/35 hover:text-sidebar-text"
              aria-label="Lukk meny"
            >
              <X className="h-4 w-4" />
            </Button>

            {backTarget ? (
              <button
                type="button"
                onClick={() => {
                  setFocusedSectionId(backTarget.id);
                  navigate(backTarget.href);
                }}
                className="mb-3 inline-flex items-center gap-2 text-sm text-sidebar-text-muted transition-colors hover:text-sidebar-text"
              >
                <ChevronLeft className="h-4 w-4" />
                Tilbake
              </button>
            ) : null}

            {isSectionActive ? (
              <h2 className="text-sm font-semibold text-sidebar-text">{currentSection.label ?? currentSection.id}</h2>
            ) : (
              <Link
                to={currentSection.href}
                className="block text-sm font-medium text-sidebar-text-muted transition-colors hover:text-sidebar-text focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
              >
                {currentSection.label ?? currentSection.id}
              </Link>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
            <ul className="space-y-1" role="list">
              {items.map((item) => {
                const isActive = location.pathname === item.href;
                const isInActiveTrail = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                const hasChildren = Boolean(item.children?.length);

                return (
                  <li key={item.id} role="listitem">
                    <Link
                      to={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        if (hasChildren) {
                          setFocusedSectionId(item.id);
                          return;
                        }
                      }}
                      className={cn(
                        'group block rounded-xl border border-transparent px-3 py-3 text-sm transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-sidebar-ring',
                        isActive
                          ? 'border-sidebar-accent/40 bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                          : 'text-sidebar-text hover:border-sidebar-border hover:bg-sidebar-accent/10',
                        !isActive && isInActiveTrail && 'border-sidebar-border/70 bg-sidebar-accent/5 font-medium text-sidebar-text',
                      )}
                    >
                      {item.label ?? item.id}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type TrailEntry = {
  node: RouteBranch;
  level: number;
};

function findTrail(branches: RouteBranch[], path: string, level = 0, currentTrail: TrailEntry[] = []): TrailEntry[] {
  for (const branch of branches) {
    const nextTrail = [...currentTrail, { node: branch, level }];

    if (path === branch.href) {
      return nextTrail;
    }

    if (branch.children?.length) {
      const childTrail = findTrail(branch.children, path, level + 1, nextTrail);
      if (childTrail.length > 0) {
        return childTrail;
      }
    }
  }

  return [];
}

function findNodeWithParent(
  branches: RouteBranch[],
  targetId: string,
  parent: RouteBranch | null = null,
): { node: RouteBranch; parent: RouteBranch | null } | null {
  for (const branch of branches) {
    if (branch.id === targetId) {
      return { node: branch, parent };
    }

    if (branch.children?.length) {
      const found = findNodeWithParent(branch.children, targetId, branch);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function filterVisibleBranches(branches: RouteBranch[]): RouteBranch[] {
  return branches
    .filter((branch) => !branch.hidden)
    .map((branch) => ({
      ...branch,
      children: branch.children ? filterVisibleBranches(branch.children) : undefined,
    }));
}
