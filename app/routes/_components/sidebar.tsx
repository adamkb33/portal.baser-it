import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { useState } from 'react';

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
      <ul className="space-y-1" role="list">
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
  const hasChildren = item.children && item.children.length > 0;
  const isInActiveTrail = currentPath.startsWith(item.href);
  const [isExpanded, setIsExpanded] = useState(isInActiveTrail);
  const isActive = currentPath === item.href;

  const indentPadding = level * 16;
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
    if (level === 0) return 'w-0.5';
    if (level === 1) return 'w-1';
    if (level === 2) return 'w-1.5';
    return 'w-2';
  };

  const getTextWeight = () => {
    if (!isActive) {
      return level === 0 ? 'font-semibold' : 'font-medium';
    }
    if (level === 0) return 'font-semibold';
    if (level === 1) return 'font-semibold';
    return 'font-semibold';
  };

  return (
    <li role="listitem">
      <div className="relative">
        <div
          className={`
            absolute left-0 top-0 bottom-0 transition-all duration-200 rounded-r
            ${getBorderWidth()}
            ${isActive ? 'bg-primary' : isInActiveTrail ? 'bg-secondary/50' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        <div className="flex items-stretch min-h-[44px]">
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
                flex-shrink-0 w-10 flex items-center justify-center
                transition-all duration-200 rounded
                hover:bg-muted 
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
              "
            >
              <svg
                className={`
                  w-4 h-4 transition-transform duration-200
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

          <Link
            to={item.href}
            aria-current={isActive ? 'page' : undefined}
            style={{ paddingLeft: hasChildren ? '8px' : `${totalLeftPadding}px` }}
            className={`
              flex-1 flex items-center
              py-2.5 pr-3
              text-[0.9375rem] leading-snug transition-all duration-200
              rounded-r 
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
              ${getTextWeight()}
              ${
                isActive
                  ? `text-primary ${getHighlightOpacity()}`
                  : isInActiveTrail
                    ? `text-foreground ${getTrailOpacity()}`
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }
            `}
          >
            <span className="truncate">{item.label}</span>
          </Link>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="mt-1 space-y-1" role="list" aria-label={`${item.label} undermeny`}>
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} currentPath={currentPath} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
