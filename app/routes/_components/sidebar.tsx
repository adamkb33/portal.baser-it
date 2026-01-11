import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { getIcon } from '~/lib/route-icon-map';

type SidebarProps = {
  branches: RouteBranch[];
};

export function Sidebar({ branches }: SidebarProps) {
  const location = useLocation();

  if (branches.length === 0) {
    return null;
  }

  return (
    <nav className="w-full bg-sidebar-bg" aria-label="Main navigation">
      <ul className="space-y-0.5 md:space-y-1" role="list">
        {branches.map((item) => (
          <SidebarItem key={item.id} item={item} currentPath={location.pathname} level={0} />
        ))}
      </ul>
    </nav>
  );
}

type SidebarItemProps = {
  item: RouteBranch;
  currentPath: string;
  level: number;
};

function SidebarItem({ item, currentPath, level }: SidebarItemProps) {
  const Icon = item.iconName ? getIcon(item.iconName) : undefined;
  const hasChildren = item.children && item.children.length > 0;
  const isInActiveTrail = currentPath.startsWith(item.href);
  const isActive = currentPath === item.href;

  const indentPadding = level * 16; // 16px indent per level

  const getHighlightOpacity = () => {
    if (level === 0) return 'bg-sidebar-accent/30';
    if (level === 1) return 'bg-sidebar-accent/40';
    if (level === 2) return 'bg-sidebar-accent/50';
    return 'bg-sidebar-accent/60';
  };

  const getTrailOpacity = () => {
    if (level === 0) return 'bg-sidebar-accent/10';
    if (level === 1) return 'bg-sidebar-accent/15';
    if (level === 2) return 'bg-sidebar-accent/20';
    return 'bg-sidebar-accent/25';
  };

  const getBorderWidth = () => {
    if (level === 0) return 'w-0.5';
    if (level === 1) return 'w-1';
    if (level === 2) return 'w-1.5';
    return 'w-2';
  };

  const getTextWeight = () => {
    return isActive || level === 0 ? 'font-semibold' : 'font-medium';
  };

  return (
    <li role="listitem">
      <div className="relative">
        {/* Left border indicator */}
        <div
          className={`
            absolute left-0 top-0 bottom-0 transition-all duration-200 rounded-r
            ${getBorderWidth()}
            ${isActive ? 'bg-sidebar-accent-foreground' : isInActiveTrail ? 'bg-sidebar-border' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        {/* Navigation link */}
        <Link
          to={item.href}
          aria-current={isActive ? 'page' : undefined}
          style={{ paddingLeft: `${indentPadding + 12}px` }}
          className={`
            flex items-center gap-3
            py-3 md:py-2.5 pr-3 min-h-[48px] md:min-h-[44px]
            text-sm md:text-[0.9375rem] leading-tight md:leading-snug 
            transition-all duration-200
            rounded-r 
            active:scale-[0.98]
            focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-inset
            ${getTextWeight()}
            ${
              isActive
                ? `text-sidebar-accent-foreground ${getHighlightOpacity()}`
                : isInActiveTrail
                  ? `text-sidebar-text ${getTrailOpacity()}`
                  : 'text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-accent active:bg-sidebar-accent/80'
            }
          `}
        >
          {Icon && level === 0 && (
            <Icon
              className={`h-5 w-5 shrink-0 ${isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-text-muted'}`}
              aria-hidden="true"
            />
          )}

          <span className="truncate">{item.label}</span>
        </Link>
      </div>

      {/* Child items - always rendered */}
      {hasChildren && (
        <ul className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1" role="list" aria-label={`${item.label} undermeny`}>
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} currentPath={currentPath} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
