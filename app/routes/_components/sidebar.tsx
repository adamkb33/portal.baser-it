import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { useState } from 'react';
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
    <nav className="w-full" aria-label="Main navigation">
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
  const [isExpanded, setIsExpanded] = useState(isInActiveTrail);
  const isActive = currentPath === item.href;

  // Mobile: 12px per level
  const indentPadding = level * 12;
  const baseLeftPadding = hasChildren ? 0 : 40;
  const totalLeftPadding = baseLeftPadding + indentPadding;

  const getHighlightOpacity = () => {
    if (level === 0) return 'bg-accent/10';
    if (level === 1) return 'bg-accent/20';
    if (level === 2) return 'bg-accent/35';
    return 'bg-accent/50';
  };

  const getTrailOpacity = () => {
    if (level === 0) return 'bg-muted/5';
    if (level === 1) return 'bg-muted/15';
    if (level === 2) return 'bg-muted/25';
    return 'bg-muted/30';
  };

  const getBorderWidth = () => {
    if (level === 0) return 'w-0.5 md:w-0.5';
    if (level === 1) return 'w-1 md:w-1';
    if (level === 2) return 'w-1.5 md:w-1.5';
    return 'w-2';
  };

  const getTextWeight = () => {
    if (!isActive) {
      return level === 0 ? 'font-semibold' : 'font-medium';
    }
    return 'font-semibold';
  };

  return (
    <li role="listitem">
      <div className="relative">
        {/* Left border indicator */}
        <div
          className={`
            absolute left-0 top-0 bottom-0 transition-all duration-200 rounded-r
            ${getBorderWidth()}
            ${isActive ? 'bg-primary' : isInActiveTrail ? 'bg-secondary/50' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        {/* Interactive row - 48px minimum on mobile, 44px on desktop */}
        <div className="flex items-stretch min-h-[48px] md:min-h-[44px]">
          {/* Expand/collapse button - 48px touch target mobile, 40px desktop */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Skjul' : 'Vis'} ${item.label}`}
              style={{ marginLeft: `${indentPadding}px` }}
              className="
                flex-shrink-0 w-12 md:w-10 flex items-center justify-center
                transition-all duration-200 rounded
                hover:bg-muted active:bg-muted/80
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
              "
            >
              <svg
                className={`
                  w-4 h-4 md:w-4 md:h-4 transition-transform duration-200
                  ${isExpanded ? 'rotate-90' : 'rotate-0'}
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Navigation link - responsive padding and text, icon only for level 0 */}
          <Link
            to={item.href}
            aria-current={isActive ? 'page' : undefined}
            style={{ paddingLeft: hasChildren ? '8px' : `${totalLeftPadding}px` }}
            className={`
              flex-1 flex items-center gap-3
              py-3 md:py-2.5 pr-3
              text-sm md:text-[0.9375rem] leading-tight md:leading-snug 
              transition-all duration-200
              rounded-r 
              active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
              ${getTextWeight()}
              ${
                isActive
                  ? `text-primary ${getHighlightOpacity()}`
                  : isInActiveTrail
                    ? `text-foreground ${getTrailOpacity()}`
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
              }
            `}
          >
            {/* Icon - only for top-level items (level 0) */}
            {Icon && level === 0 && (
              <Icon
                className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                aria-hidden="true"
              />
            )}

            <span className="truncate">{item.label}</span>
          </Link>
        </div>
      </div>

      {/* Child items - progressive disclosure */}
      {hasChildren && isExpanded && (
        <ul className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1" role="list" aria-label={`${item.label} undermeny`}>
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} currentPath={currentPath} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
