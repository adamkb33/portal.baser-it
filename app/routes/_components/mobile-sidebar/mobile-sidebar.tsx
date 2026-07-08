import * as React from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronLeft, ChevronRight, Ellipsis, X } from 'lucide-react';
import { getIcon } from '~/lib/routing/route-icon-map';
import type { RouteBranch } from '~/lib/routing/route-tree';
import { Button, cn } from '~/ui';
import { Sidebar, type SidebarWorkspace } from '../sidebar';

const DEFAULT_MAX_VISIBLE = 5;
const MOBILE_RADIUS = 'rounded-[1.35rem]';

type MobileSidebarProps = {
  branches: RouteBranch[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateWithinMenu?: () => void;
  maxVisible?: number;
  workspace?: SidebarWorkspace | null;
};

type TrailEntry = {
  node: RouteBranch;
  level: number;
};

type MobileNavPage = {
  items: RouteBranch[];
  pageCount: number;
  hasOverflow: boolean;
  isLastPage: boolean;
  controlLabel: string | null;
};

export function MobileSidebar({
  branches,
  isOpen,
  onClose,
  onNavigateWithinMenu,
  maxVisible = DEFAULT_MAX_VISIBLE,
  workspace,
}: MobileSidebarProps) {
  const location = useLocation();
  const visibleRoots = React.useMemo(() => filterVisibleBranches(branches), [branches]);
  const activeTrail = React.useMemo(
    () => findTrail(visibleRoots, location.pathname),
    [visibleRoots, location.pathname],
  );
  const activeRoot = activeTrail[0]?.node ?? visibleRoots[0] ?? null;
  const primaryBranches = React.useMemo(() => {
    if (!activeRoot) {
      return [];
    }

    const children = getVisibleChildren(activeRoot);
    return children.length > 0 ? children : visibleRoots;
  }, [activeRoot, visibleRoots]);
  const activePrimaryId = activeTrail[1]?.node.id ?? primaryBranches[0]?.id ?? null;
  const defaultPageIndex = React.useMemo(
    () => getPageIndexForBranch(primaryBranches, activePrimaryId, maxVisible),
    [activePrimaryId, maxVisible, primaryBranches],
  );
  const [pageIndex, setPageIndex] = React.useState(defaultPageIndex);
  const [drawerStack, setDrawerStack] = React.useState<RouteBranch[]>([]);
  const previousIsOpenRef = React.useRef(isOpen);

  React.useEffect(() => {
    setPageIndex(defaultPageIndex);
  }, [defaultPageIndex]);

  React.useEffect(() => {
    const openedFromExternalTrigger = isOpen && !previousIsOpenRef.current;

    if (openedFromExternalTrigger) {
      setDrawerStack(getInitialDrawerStack(activeTrail, activeRoot?.id ?? null));
    }

    previousIsOpenRef.current = isOpen;
  }, [activeRoot?.id, activeTrail, isOpen]);

  const currentPage = React.useMemo(
    () => getMobileNavPage(primaryBranches, pageIndex, maxVisible),
    [maxVisible, pageIndex, primaryBranches],
  );

  if (primaryBranches.length === 0) {
    return null;
  }

  const currentDrawerBranch = drawerStack.at(-1) ?? null;
  const drawerItems = currentDrawerBranch ? getVisibleChildren(currentDrawerBranch) : [];
  const drawerOpen = drawerStack.length > 0 && drawerItems.length > 0;
  function closeDrawer() {
    setDrawerStack([]);
    onClose();
  }

  function handlePrimarySelect(branch: RouteBranch) {
    const children = getVisibleChildren(branch);
    if (children.length > 0) {
      setDrawerStack([branch]);
      return;
    }

    closeDrawer();
  }

  function handleDrawerSelect(branch: RouteBranch) {
    const children = getVisibleChildren(branch);
    if (children.length > 0) {
      setDrawerStack((current) => appendBranchToStack(current, branch));
      return;
    }

    closeDrawer();
  }

  function handlePrimaryClick(event: React.MouseEvent<HTMLAnchorElement>, branch: RouteBranch) {
    if (shouldStayWithinBranch(location.pathname, branch)) {
      event.preventDefault();
    }

    if (getVisibleChildren(branch).length > 0) {
      onNavigateWithinMenu?.();
    }

    handlePrimarySelect(branch);
  }

  function handleDrawerClick(event: React.MouseEvent<HTMLAnchorElement>, branch: RouteBranch) {
    if (shouldStayWithinBranch(location.pathname, branch)) {
      event.preventDefault();
    }

    if (getVisibleChildren(branch).length > 0) {
      onNavigateWithinMenu?.();
    }

    handleDrawerSelect(branch);
  }

  function handleBack() {
    setDrawerStack((current) => {
      const next = current.slice(0, -1);
      if (next.length === 0) {
        onClose();
      }
      return next;
    });
  }

  function handlePageControl() {
    closeDrawer();
    setPageIndex((current) => (currentPage.isLastPage ? 0 : current + 1));
  }

  return (
    <>
      {isOpen && !drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[3px]"
            onClick={onClose}
            aria-label="Lukk navigasjon"
          />

          <aside
            className={cn(
              'absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col border-r border-border bg-background px-4 py-5 shadow-[20px_0_60px_rgba(15,23,42,0.18)]',
              'duration-200 animate-in slide-in-from-left-4',
            )}
            aria-label="Mobil hovednavigasjon"
          >
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-9 text-text-muted"
                aria-label="Lukk meny"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Sidebar branches={branches} workspace={workspace} />
          </aside>
        </div>
      ) : null}

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/22 backdrop-blur-[6px]"
            onClick={closeDrawer}
            aria-label="Lukk undermeny"
          />

          <section
            className={cn(
              'absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] mx-auto w-full max-w-[var(--container-xl)]',
              'max-h-[min(68vh,32rem)] overflow-hidden bg-transparent',
              MOBILE_RADIUS,
            )}
            aria-label="Mobil undermeny"
          >
            <div
              className={cn(
                'max-h-[min(68vh,32rem)] overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-1.5 shadow-[0_-20px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/80',
                MOBILE_RADIUS,
              )}
            >
              <header className="relative z-10 flex items-center justify-between gap-3 border-b border-sidebar-border/50 px-2 pb-3 pt-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className={cn(
                      'h-8 w-8 shrink-0 bg-sidebar-bg/75 text-sidebar-text-muted hover:bg-sidebar-accent/8 hover:text-sidebar-text',
                      MOBILE_RADIUS,
                    )}
                    aria-label="Gå tilbake"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-sidebar-text">
                      {currentDrawerBranch?.label ?? currentDrawerBranch?.id}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeDrawer}
                  className={cn(
                    'h-8 w-8 shrink-0 bg-sidebar-bg/75 text-sidebar-text-muted hover:bg-sidebar-accent/8 hover:text-sidebar-text',
                    MOBILE_RADIUS,
                  )}
                  aria-label="Lukk meny"
                >
                  <X className="h-4 w-4" />
                </Button>
              </header>

              <nav
                className="max-h-[calc(min(68vh,32rem)-5rem)] overflow-y-auto px-1.5 pb-2 pt-2"
                aria-label="Mobil navigasjon"
              >
                <ul className="space-y-2" role="list">
                  {drawerItems.map((item) => {
                    const Icon = getIcon(item.iconName);
                    const isActive = isBranchActive(location.pathname, item.href);
                    const hasChildren = getVisibleChildren(item).length > 0;

                    return (
                      <li key={item.id} role="listitem">
                        <Link
                          to={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={(event) => handleDrawerClick(event, item)}
                          className={cn(
                            'group flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-sidebar-ring',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'bg-sidebar-bg/75 text-sidebar-text hover:bg-sidebar-accent/8',
                            MOBILE_RADIUS,
                          )}
                        >
                          <span className="inline-flex min-w-0 items-center gap-3">
                            {Icon ? (
                              <span
                                className={cn(
                                  'inline-flex h-8 w-8 shrink-0 items-center justify-center',
                                  isActive
                                    ? 'bg-sidebar-accent-foreground/12 text-sidebar-accent-foreground'
                                    : hasChildren
                                      ? 'bg-sidebar-accent/10 text-sidebar-text group-hover:bg-sidebar-accent/14'
                                      : 'bg-sidebar-accent/8 text-sidebar-text-muted group-hover:bg-sidebar-accent/14 group-hover:text-sidebar-text',
                                  MOBILE_RADIUS,
                                )}
                              >
                                <Icon className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
                              </span>
                            ) : null}
                            <span className="block min-w-0 truncate font-medium">{item.label ?? item.id}</span>
                          </span>

                          <span
                            className={cn(
                              'inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors',
                              isActive
                                ? 'bg-sidebar-accent-foreground/12 text-sidebar-accent-foreground'
                                : hasChildren
                                  ? 'bg-transparent text-sidebar-text-muted group-hover:bg-sidebar-accent/8 group-hover:text-sidebar-text'
                                  : 'bg-transparent text-sidebar-text-muted group-hover:bg-sidebar-accent/10 group-hover:text-sidebar-text',
                              MOBILE_RADIUS,
                            )}
                          >
                            {hasChildren ? (
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <span className="text-[11px] font-semibold">Gå</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </section>
        </div>
      ) : null}

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 lg:hidden',
        )}
        aria-label="Mobil bunnnavigasjon"
      >
        <div
          className={cn(
            'mx-auto w-full max-w-[var(--container-xl)] bg-[linear-gradient(180deg,rgba(241,245,249,0.95),rgba(255,255,255,0.92))] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/80',
            MOBILE_RADIUS,
          )}
        >
          <ul
            className="grid gap-1"
            role="list"
            style={{
              gridTemplateColumns: `repeat(${currentPage.hasOverflow ? maxVisible : currentPage.items.length}, minmax(0, 1fr))`,
            }}
          >
            {currentPage.items.map((branch) => {
              const Icon = getIcon(branch.iconName);
              const isActive = isBranchActive(location.pathname, branch.href);

              return (
                <li key={branch.id} role="listitem">
                  <Link
                    to={branch.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(event) => handlePrimaryClick(event, branch)}
                    className={cn(
                      'flex min-h-[4rem] w-full flex-col items-center justify-center gap-1 px-2 py-2 text-center text-[11px] font-medium transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-sidebar-ring',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'bg-transparent text-text-secondary hover:bg-sidebar-accent/8 hover:text-text-primary',
                      MOBILE_RADIUS,
                    )}
                  >
                    {Icon ? (
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center transition-colors',
                          isActive ? 'bg-sidebar-accent-foreground/12' : 'bg-transparent',
                          MOBILE_RADIUS,
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </span>
                    ) : null}
                    <span className="w-full truncate leading-tight">{branch.label ?? branch.id}</span>
                  </Link>
                </li>
              );
            })}

            {currentPage.controlLabel ? (
              <li role="listitem">
                <button
                  type="button"
                  onClick={handlePageControl}
                  className={cn(
                    'flex min-h-[4rem] w-full flex-col items-center justify-center gap-1 px-2 py-2 text-center text-[11px] font-medium text-text-secondary transition-all hover:bg-white/45 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-sidebar-ring',
                    MOBILE_RADIUS,
                  )}
                >
                  <span
                    className={cn('inline-flex h-7 w-7 items-center justify-center bg-sidebar-accent/8', MOBILE_RADIUS)}
                  >
                    <Ellipsis className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <span className="w-full truncate leading-tight">{currentPage.controlLabel}</span>
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      </nav>
    </>
  );
}

export function getMobileNavPage(
  branches: RouteBranch[],
  pageIndex: number,
  maxVisible = DEFAULT_MAX_VISIBLE,
): MobileNavPage {
  if (branches.length === 0) {
    return { items: [], pageCount: 0, hasOverflow: false, isLastPage: true, controlLabel: null };
  }

  if (branches.length <= maxVisible) {
    return {
      items: branches,
      pageCount: 1,
      hasOverflow: false,
      isLastPage: true,
      controlLabel: null,
    };
  }

  const pageSize = Math.max(1, maxVisible - 1);
  const pageCount = Math.ceil(branches.length / pageSize);
  const safePageIndex = Math.min(Math.max(pageIndex, 0), pageCount - 1);
  const start = safePageIndex * pageSize;
  const isLastPage = safePageIndex === pageCount - 1;

  return {
    items: branches.slice(start, start + pageSize),
    pageCount,
    hasOverflow: true,
    isLastPage,
    controlLabel: isLastPage ? 'Start' : 'Mer',
  };
}

export function getPageIndexForBranch(
  branches: RouteBranch[],
  branchId: string | null,
  maxVisible = DEFAULT_MAX_VISIBLE,
): number {
  if (!branchId || branches.length <= maxVisible) {
    return 0;
  }

  const branchIndex = branches.findIndex((branch) => branch.id === branchId);
  if (branchIndex < 0) {
    return 0;
  }

  return Math.floor(branchIndex / Math.max(1, maxVisible - 1));
}

export function getInitialDrawerStack(activeTrail: TrailEntry[], rootId: string | null): RouteBranch[] {
  if (!rootId) {
    return [];
  }

  return activeTrail
    .map((entry) => entry.node)
    .filter((node) => node.id !== rootId)
    .filter((node) => getVisibleChildren(node).length > 0);
}

function appendBranchToStack(current: RouteBranch[], branch: RouteBranch): RouteBranch[] {
  const existingIndex = current.findIndex((item) => item.id === branch.id);
  if (existingIndex >= 0) {
    return current.slice(0, existingIndex + 1);
  }

  return [...current, branch];
}

function findTrail(branches: RouteBranch[], path: string, level = 0, currentTrail: TrailEntry[] = []): TrailEntry[] {
  for (const branch of branches) {
    const nextTrail = [...currentTrail, { node: branch, level }];

    if (matchesBranchPath(path, branch.href)) {
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

function getVisibleChildren(branch: RouteBranch): RouteBranch[] {
  return filterVisibleBranches(branch.children ?? []);
}

function filterVisibleBranches(branches: RouteBranch[]): RouteBranch[] {
  return branches
    .filter((branch) => !branch.hidden)
    .map((branch) => ({
      ...branch,
      children: branch.children ? filterVisibleBranches(branch.children) : undefined,
    }));
}

function isBranchActive(pathname: string, href: string): boolean {
  return matchesBranchPath(pathname, href) || isWithinBranchSubtree(pathname, href);
}

function isWithinBranchSubtree(pathname: string, href: string): boolean {
  const basePath = normalizeBranchBasePath(href);
  if (!basePath) {
    return false;
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function matchesBranchPath(pathname: string, href: string): boolean {
  const pathnameParts = splitPathSegments(pathname);
  const hrefParts = splitPathSegments(href);

  if (pathnameParts.length !== hrefParts.length) {
    return false;
  }

  return hrefParts.every((part, index) => part.startsWith(':') || part === pathnameParts[index]);
}

export function shouldStayWithinBranch(pathname: string, branch: RouteBranch): boolean {
  return getVisibleChildren(branch).length > 0 && isWithinBranchSubtree(pathname, branch.href);
}

export function shouldCloseOnLeafSelection(branch: RouteBranch): boolean {
  return getVisibleChildren(branch).length === 0;
}

function normalizeBranchBasePath(href: string): string {
  const parts = splitPathSegments(href).filter((part) => !part.startsWith(':'));
  return parts.length === 0 ? '/' : `/${parts.join('/')}`;
}

function splitPathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}
