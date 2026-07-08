import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/ui';
import { ROUTES_MAP, type RouteBranch } from '~/lib/routing/route-tree';
import { getIcon } from '~/lib/routing/route-icon-map';
import PTLLogo from '~/components/logos/PTL.logo';

export type SidebarWorkspace = {
  name: string;
  subtitle?: string;
};

type SidebarProps = {
  branches: RouteBranch[];
  workspace?: SidebarWorkspace | null;
};

type SidebarSectionModel = {
  id: string;
  label: string;
  overview?: RouteBranch;
  items: RouteBranch[];
};

/**
 * App sidebar — mirrors the template `.d-sidebar`: brand block, grouped
 * `nav-section`s with a mono uppercase label, leaf nav-links, and collapsible
 * `nav-item-group`s with an indented submenu. Driven by the (already
 * auth-filtered) SIDEBAR route tree.
 */
export function Sidebar({ branches, workspace }: SidebarProps) {
  const location = useLocation();
  const sections = React.useMemo(() => buildSections(branches), [branches]);

  if (sections.length === 0) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <SidebarBrand />

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto" aria-label="Hovednavigasjon">
        {sections.map((section) => (
          <SidebarSection key={section.id} section={section} pathname={location.pathname} />
        ))}
      </nav>

      {workspace ? <SidebarFooter workspace={workspace} /> : null}
    </div>
  );
}

function SidebarBrand() {
  return (
    <Link to="/" className="flex items-center border-b border-border pb-5 pl-1">
      <PTLLogo size="md" />
    </Link>
  );
}

function SidebarSection({ section, pathname }: { section: SidebarSectionModel; pathname: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text-disabled">
        {section.label}
      </span>
      <ul className="flex flex-col gap-0.5" role="list">
        {section.overview ? (
          <li role="listitem">
            <SidebarLeaf branch={section.overview} pathname={pathname} />
          </li>
        ) : null}
        {section.items.map((item) =>
          item.children?.length ? (
            <li key={item.id} role="listitem">
              <SidebarGroup item={item} pathname={pathname} />
            </li>
          ) : (
            <li key={item.id} role="listitem">
              <SidebarLeaf branch={item} pathname={pathname} />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

const navLinkBase =
  'group flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive sm:min-h-0 sm:py-2';

function isActive(href: string, pathname: string) {
  return pathname === href;
}
function inTrail(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLeaf({ branch, pathname }: { branch: RouteBranch; pathname: string }) {
  const LucideIcon = getIcon(branch.iconName);
  const active = isActive(branch.href, pathname);
  const trail = inTrail(branch.href, pathname);

  return (
    <Link
      to={branch.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        navLinkBase,
        active
          ? 'bg-blue-50 text-interactive shadow-[inset_3px_0_0_var(--color-interactive)]'
          : 'text-text-secondary hover:bg-surface-variant-1 hover:text-text-primary',
        !active && trail && 'text-text-primary',
      )}
    >
      {LucideIcon ? <LucideIcon className="size-[17px] shrink-0" strokeWidth={1.75} aria-hidden /> : null}
      <span className="min-w-0 flex-1 truncate">{branch.label ?? branch.id}</span>
    </Link>
  );
}

function SidebarGroup({ item, pathname }: { item: RouteBranch; pathname: string }) {
  const LucideIcon = getIcon(item.iconName);
  const children = item.children ?? [];
  const groupInTrail = inTrail(item.href, pathname);
  const [open, setOpen] = React.useState(groupInTrail);

  // Auto-open when the active route falls inside this group.
  React.useEffect(() => {
    if (groupInTrail) setOpen(true);
  }, [groupInTrail]);

  const parentActive = isActive(item.href, pathname);

  return (
    <div>
      <div
        className={cn(
          'flex items-center rounded-[var(--radius-control)]',
          parentActive
            ? 'bg-blue-50 text-interactive shadow-[inset_3px_0_0_var(--color-interactive)]'
            : groupInTrail
              ? 'text-text-primary'
              : 'text-text-secondary',
        )}
      >
        <Link
          to={item.href}
          aria-current={parentActive ? 'page' : undefined}
          onClick={() => setOpen(true)}
          className={cn(navLinkBase, 'min-w-0 flex-1 bg-transparent', !parentActive && 'hover:text-text-primary')}
        >
          {LucideIcon ? <LucideIcon className="size-[17px] shrink-0" strokeWidth={1.75} aria-hidden /> : null}
          <span className="min-w-0 flex-1 truncate">{item.label ?? item.id}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? 'Skjul undermeny' : 'Vis undermeny'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mr-1 grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] text-text-disabled transition-colors hover:bg-surface-variant-1 hover:text-text-secondary sm:size-7"
        >
          <ChevronRight className={cn('size-3 transition-transform duration-200', open && 'rotate-90')} aria-hidden />
        </button>
      </div>

      <div
        className={cn(
          'relative ml-5 overflow-hidden pl-3.5 transition-[max-height] duration-300 ease-out',
          'before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-px before:bg-border',
          open ? 'max-h-[400px]' : 'max-h-0',
        )}
      >
        <ul className="flex flex-col gap-0.5 py-1" role="list">
          {children.map((child) => (
            <li key={child.id} role="listitem">
              <SidebarSubLink branch={child} pathname={pathname} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SidebarSubLink({ branch, pathname }: { branch: RouteBranch; pathname: string }) {
  const active = isActive(branch.href, pathname);
  return (
    <Link
      to={branch.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-10 items-center rounded-[6px] px-2.5 py-2 text-[12.5px] transition-[color,background-color,padding] focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive sm:min-h-0 sm:py-1.5',
        active
          ? 'bg-blue-50 font-semibold text-interactive'
          : 'text-text-secondary hover:bg-surface-variant-1 hover:pl-3 hover:text-text-primary',
      )}
    >
      <span className="min-w-0 flex-1 truncate">{branch.label ?? branch.id}</span>
    </Link>
  );
}

function SidebarFooter({ workspace }: { workspace: SidebarWorkspace }) {
  const navigate = useNavigate();
  const initials = getInitials(workspace.name);
  return (
    <div className="mt-auto border-t border-border pt-4">
      <button
        type="button"
        aria-label="Bytt selskap"
        onClick={() => navigate(ROUTES_MAP['user.company-context'].href)}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-left transition-colors hover:bg-surface-variant-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive sm:min-h-0 sm:py-1.5"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-interactive),var(--color-purple))] text-[12.5px] font-semibold text-text-inverse">
          {initials}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-semibold text-text-primary">{workspace.name}</span>
          {workspace.subtitle ? (
            <span className="block truncate text-[11px] text-text-disabled">{workspace.subtitle}</span>
          ) : null}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-text-disabled" aria-hidden />
      </button>
    </div>
  );
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function filterVisibleBranches(branches: RouteBranch[]): RouteBranch[] {
  return branches
    .filter((branch) => !branch.hidden)
    .map((branch) => ({
      ...branch,
      children: branch.children ? filterVisibleBranches(branch.children) : undefined,
    }));
}

function buildSections(branches: RouteBranch[]): SidebarSectionModel[] {
  const sections: SidebarSectionModel[] = [];

  for (const branch of filterVisibleBranches(branches)) {
    const children = branch.children ?? [];

    if (children.length === 0) {
      sections.push({
        id: branch.id,
        label: branch.label ?? branch.id,
        items: [branch],
      });
      continue;
    }

    const directLeaves = children.filter((child) => !child.children?.length);
    sections.push({
      id: branch.id,
      label: branch.label ?? branch.id,
      overview: {
        ...branch,
        id: `${branch.id}.overview`,
        label: 'Oversikt',
        children: undefined,
      },
      items: directLeaves,
    });

    for (const child of children) {
      if (!child.children?.length) continue;

      sections.push({
        id: child.id,
        label: child.label ?? child.id,
        overview: {
          ...child,
          id: `${child.id}.overview`,
          label: 'Oversikt',
          children: undefined,
        },
        items: child.children,
      });
    }
  }

  return sections;
}
