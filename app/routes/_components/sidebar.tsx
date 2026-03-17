import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { cn } from '~/ui';
import type { RouteBranch } from '~/lib/route-tree';

type SidebarProps = {
  branches: RouteBranch[];
};

export function Sidebar({ branches }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const visibleBranches = React.useMemo(() => filterVisibleBranches(branches), [branches]);
  const activeTrail = React.useMemo(
    () => findTrail(visibleBranches, location.pathname),
    [visibleBranches, location.pathname],
  );
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
  const activeParent = activeTrail.length > 1 ? (activeTrail.at(-2)?.node ?? null) : null;
  const backTarget = activeNode && activeNode.id !== currentSection.id ? activeParent : parentSection;
  const isSectionActive = activeNode?.id === currentSection.id;

  return (
    <nav className="flex w-full flex-col" aria-label="Main navigation">
      <div className="border-b border-border px-3 py-4">
        {backTarget ? (
          <button
            type="button"
            onClick={() => {
              setFocusedSectionId(backTarget.id);
              navigate(backTarget.href);
            }}
            className="mb-3 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Tilbake
          </button>
        ) : (
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary invisible"
          >
            <ChevronLeft className="h-4 w-4" />
            Tilbake
          </button>
        )}

        {isSectionActive ? (
          <h2 className="text-sm font-semibold text-text-primary">{currentSection.label ?? currentSection.id}</h2>
        ) : (
          <Link
            to={currentSection.href}
            className="block text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
          >
            {currentSection.label ?? currentSection.id}
          </Link>
        )}
      </div>

      <ul className="space-y-1 px-3 py-4" role="list">
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
                  }
                }}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-sidebar-ring',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-text hover:bg-sidebar-accent/10',
                  !isActive && isInActiveTrail && 'font-medium text-sidebar-text',
                )}
              >
                {item.label ?? item.id}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
