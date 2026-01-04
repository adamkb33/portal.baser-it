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

  const indentPadding = level * 12;
  const baseLeftPadding = hasChildren ? 0 : 40;
  const totalLeftPadding = baseLeftPadding + indentPadding;

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
            ${isActive ? 'bg-primary' : isInActiveTrail ? 'bg-secondary/50' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        {/* Interactive row */}
        <div className="flex items-stretch min-h-[48px] md:min-h-[44px]">
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Skjul' : 'Vis'} ${item.label}`}
              style={{ marginLeft: `${indentPadding}px` }}
              className="flex-shrink-0 w-12 md:w-10 flex items-center justify-center transition-all duration-200 rounded hover:bg-sidebar-accent active:bg-sidebar-accent/80 focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-inset"
            >
              <svg
                className={`
                  w-4 h-4 transition-transform duration-200
                  ${isExpanded ? 'rotate-90' : 'rotate-0'}
                  ${isActive ? 'text-primary' : 'text-sidebar-text-muted'}
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

          {/* Navigation link */}
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
              focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-inset
              ${getTextWeight()}
              ${
                isActive
                  ? `text-primary ${getHighlightOpacity()}`
                  : isInActiveTrail
                    ? `text-sidebar-text ${getTrailOpacity()}`
                    : 'text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-accent active:bg-sidebar-accent/80'
              }
            `}
          >
            {Icon && level === 0 && (
              <Icon
                className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-sidebar-text-muted'}`}
                aria-hidden="true"
              />
            )}

            <span className="truncate">{item.label}</span>
          </Link>
        </div>
      </div>

      {/* Child items */}
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
