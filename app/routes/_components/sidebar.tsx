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

  // Breathing room: 24px per level
  const indentStyle = {
    paddingLeft: `${level === 0 ? 16 : 16 + level * 24}px`,
  };

  // Inverse highlighting: more visible as you go deeper
  // Level 0: Very subtle (10% opacity)
  // Level 1: Subtle (20% opacity)
  // Level 2: Medium (35% opacity)
  // Level 3+: Strong (50% opacity)
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

  // Border width: thinner at top, thicker at bottom
  const getBorderWidth = () => {
    if (level === 0) return 'w-0.5'; // 2px
    if (level === 1) return 'w-1'; // 4px
    if (level === 2) return 'w-1.5'; // 6px
    return 'w-2'; // 8px
  };

  // Text emphasis: less bold at top, more bold at bottom
  const getTextWeight = () => {
    if (!isActive) {
      return level === 0 ? 'font-semibold' : 'font-medium';
    }
    // Active state gets progressively bolder
    if (level === 0) return 'font-semibold';
    if (level === 1) return 'font-bold';
    return 'font-extrabold';
  };

  return (
    <li role="listitem" className="space-y-1">
      <div className="relative">
        {/* Left border - gets thicker as you go deeper */}
        <div
          className={`
            absolute left-0 top-0 bottom-0 transition-all duration-200
            ${getBorderWidth()}
            ${isActive ? 'bg-primary' : isInActiveTrail ? 'bg-secondary/50' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        <div className="flex items-center gap-2">
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} section`}
              className={`
                flex-shrink-0 w-8 h-8 flex items-center justify-center
                transition-all duration-200 rounded
                hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring
                ${level === 0 ? 'ml-2' : 'ml-0'}
              `}
            >
              <svg
                className={`
                  w-4 h-4 transition-transform duration-200
                  ${isExpanded ? 'rotate-90' : 'rotate-0'}
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Navigation link - inverse highlight intensity */}
          <Link
            to={item.href}
            aria-current={isActive ? 'page' : undefined}
            style={indentStyle}
            className={`
              flex-1 flex items-center gap-3 py-3 pr-4
              text-sm transition-all duration-200
              rounded-r focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
              ${hasChildren ? '' : level === 0 ? 'pl-14' : 'pl-6'}
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
            <span>{item.label}</span>
          </Link>
        </div>
      </div>

      {/* Progressive disclosure */}
      {hasChildren && isExpanded && (
        <ul className="space-y-1 mt-1" role="list" aria-label={`${item.label} submenu`}>
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} currentPath={currentPath} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
