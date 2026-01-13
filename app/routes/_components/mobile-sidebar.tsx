import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';
import { useEffect } from 'react';
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
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 left-0 w-[85vw] max-w-sm border-r border-sidebar-border bg-sidebar-bg z-50 lg:hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3 bg-sidebar-accent/20">
          <span className="text-sm font-semibold text-sidebar-text-muted">Meny</span>

          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded border border-sidebar-border text-sidebar-text hover:bg-sidebar-accent hover:text-sidebar-text active:scale-95 focus:outline-none focus:ring-2 focus:ring-sidebar-ring transition-all duration-200"
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

  const getTextWeight = () => {
    return isActive || level === 0 ? 'font-semibold' : 'font-medium';
  };

  return (
    <li role="listitem" className="relative">
      {/* Vertical trail line that spans this item AND all its children */}
      {hasChildren && (
        <div
          className="absolute top-6 bottom-0 w-px bg-sidebar-text/20"
          style={{ left: `${indentPadding + 6}px` }}
          aria-hidden="true"
        />
      )}

      <div className="relative">
        {/* Navigation link */}
        <Link
          to={item.href}
          onClick={onNavigate}
          aria-current={isActive ? 'page' : undefined}
          style={{ paddingLeft: `${indentPadding + 12}px` }}
          className={`
            flex items-center gap-3
            py-3 pr-3 min-h-[48px]
            text-sm leading-tight 
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
        <ul className="mt-0.5 space-y-0.5 relative" role="list" aria-label={`${item.label} undermeny`}>
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
