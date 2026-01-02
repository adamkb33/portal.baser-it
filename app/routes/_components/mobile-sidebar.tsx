import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { useState, useEffect } from 'react';
import { getIcon } from '~/lib/route-icon-map';

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
        className="fixed inset-y-0 left-0 w-[85vw] max-w-sm border-r border-border bg-background z-50 md:hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
          <span className="text-sm font-semibold text-muted-foreground">Meny</span>

          <button
            onClick={onClose}
            className="
              w-11 h-11 flex items-center justify-center
              rounded border border-border
              text-foreground hover:bg-accent hover:text-accent-foreground
              active:scale-95
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

        <nav className="overflow-y-auto h-[calc(100vh-3.75rem)] overscroll-contain">
          <ul className="py-2 px-2 space-y-0.5" role="list">
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
  const Icon = item.iconName ? getIcon(item.iconName) : undefined;
  const hasChildren = item.children && item.children.length > 0;
  const isInActiveTrail = currentPath.startsWith(item.href);
  const [isExpanded, setIsExpanded] = useState(isInActiveTrail);
  const isActive = currentPath === item.href;

  const indentPadding = level * 16;

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
    if (level === 0) return 'w-1';
    if (level === 1) return 'w-1.5';
    if (level === 2) return 'w-2';
    return 'w-2.5';
  };

  const getTextWeight = () => {
    if (!isActive) {
      return level === 0 ? 'font-semibold' : 'font-medium';
    }
    return level === 0 ? 'font-semibold' : 'font-bold';
  };

  return (
    <li role="listitem">
      <div className="relative">
        <div
          className={`
            absolute left-0 top-0 bottom-0 transition-all duration-200 rounded-r
            ${getBorderWidth()}
            ${isActive ? 'bg-primary' : isInActiveTrail ? 'bg-secondary/60' : 'bg-transparent'}
          `}
          aria-hidden="true"
        />

        <div className="flex items-center">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Skjul' : 'Vis'} ${item.label}`}
              style={{ marginLeft: level === 0 ? '4px' : `${indentPadding}px` }}
              className="
                flex-shrink-0 w-11 h-11 flex items-center justify-center
                transition-all duration-200 rounded
                hover:bg-muted active:bg-muted/80
                focus:outline-none focus:ring-2 focus:ring-ring
              "
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

          <Link
            to={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            style={{
              paddingLeft: hasChildren ? '8px' : `${(level === 0 ? 48 : 12) + indentPadding}px`,
            }}
            className={`
              flex-1 flex items-center gap-3 min-h-[48px] py-3 pr-3
              text-sm leading-tight transition-all duration-200
              rounded-r active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
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

      {hasChildren && isExpanded && (
        <ul className="mt-0.5 space-y-0.5" role="list" aria-label={`${item.label} undermeny`}>
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
