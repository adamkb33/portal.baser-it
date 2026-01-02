import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { useState, useEffect } from 'react';

type MobileSidebarProps = {
  branches: RouteBranch[];
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ branches, isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (branches.length === 0 || !isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 left-0 w-80 max-w-[85vw] border-r border-border bg-background z-50 md:hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <button
            onClick={onClose}
            className="
              w-10 h-10 flex items-center justify-center
              rounded border border-border
              text-foreground hover:bg-accent hover:text-accent-foreground
              focus:outline-none focus:ring-2 focus:ring-ring
              transition-all duration-200
            "
            aria-label="Lukk meny"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="overflow-y-auto h-[calc(100vh-4rem)] overscroll-contain">
          <ul className="py-2 px-2" role="list">
            {branches.map((item) => (
              <MobileSidebarItem
                key={item.id}
                item={item}
                currentPath={location.pathname}
                onNavigate={onClose}
                level={0}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

type MobileSidebarItemProps = {
  item: RouteBranch;
  currentPath: string;
  level: number;
  onNavigate: () => void;
};

function MobileSidebarItem({ item, currentPath, level, onNavigate }: MobileSidebarItemProps) {
  const hasChildren = item.children && item.children.length > 0;

  const isInActiveTrail = currentPath.startsWith(item.href);
  const [isExpanded, setIsExpanded] = useState(isInActiveTrail);

  const isActive = currentPath === item.href;

  // Mobile spacing: 20px per level (Emma's 8px grid: 2.5 units, rounded up)
  const indentStyle = {
    paddingLeft: `${level === 0 ? 12 : 12 + level * 20}px`,
  };

  // Inverse highlighting - MORE important on mobile (less screen space)
  const getHighlightOpacity = () => {
    if (level === 0) return 'bg-accent/10';
    if (level === 1) return 'bg-accent/25';
    if (level === 2) return 'bg-accent/40';
    return 'bg-accent/60';
  };

  const getTrailOpacity = () => {
    if (level === 0) return 'bg-muted/10';
    if (level === 1) return 'bg-muted/20';
    if (level === 2) return 'bg-muted/30';
    return 'bg-muted/40';
  };

  const getBorderWidth = () => {
    if (level === 0) return 'w-1'; // 4px
    if (level === 1) return 'w-1.5'; // 6px
    if (level === 2) return 'w-2'; // 8px
    return 'w-2.5'; // 10px
  };

  const getTextWeight = () => {
    if (!isActive) {
      return level === 0 ? 'font-semibold' : 'font-medium';
    }
    if (level === 0) return 'font-semibold';
    if (level === 1) return 'font-bold';
    return 'font-extrabold';
  };

  return (
    <li role="listitem" className="mb-1">
      <div className="relative">
        {/* Left border - thicker as you go deeper */}
        <div
          className={`
            absolute left-0 top-0 bottom-0 transition-all duration-200 rounded-r
            ${getBorderWidth()}
            ${isActive ? 'bg-primary' : isInActiveTrail ? 'bg-secondary/60' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        <div className="flex items-center gap-1">
          {/* Expand/collapse - MOBILE-SIZED touch target (48px) */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Skjul' : 'Vis'} ${item.label}`}
              className={`
                flex-shrink-0 w-12 h-12 flex items-center justify-center
                transition-all duration-200 rounded
                hover:bg-muted active:bg-muted/80
                focus:outline-none focus:ring-2 focus:ring-ring
                ${level === 0 ? 'ml-1' : 'ml-0'}
              `}
            >
              <svg
                className={`
                  w-5 h-5 transition-transform duration-200
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

          {/* Navigation link - 48px min height for mobile */}
          <Link
            to={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            style={indentStyle}
            className={`
              flex-1 flex items-center min-h-[48px] gap-3 py-3 pr-4
              text-sm transition-all duration-200
              rounded-r active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
              ${hasChildren ? '' : level === 0 ? 'pl-14' : 'pl-4'}
              ${getTextWeight()}
              ${
                isActive
                  ? `text-primary ${getHighlightOpacity()}`
                  : isInActiveTrail
                    ? `text-foreground ${getTrailOpacity()}`
                    : 'text-muted-foreground active:text-foreground active:bg-muted'
              }
            `}
          >
            <span className="leading-tight">{item.label}</span>
          </Link>
        </div>
      </div>

      {/* Progressive disclosure - CRITICAL on mobile */}
      {hasChildren && isExpanded && (
        <ul className="mt-1 space-y-1" role="list" aria-label={`${item.label} undermeny`}>
          {item.children!.map((child) => (
            <MobileSidebarItem
              key={child.id}
              item={child}
              currentPath={currentPath}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
