import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';

type MobileSidebarProps = {
  branches: RouteBranch[];
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ branches, isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();

  if (branches.length === 0 || !isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40 md:hidden" onClick={onClose} aria-hidden="true" />
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-background z-50 md:hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Meny</span>
          <button
            onClick={onClose}
            className="border border-border bg-background text-foreground px-2 py-1 text-xs font-medium rounded-none hover:bg-foreground hover:text-background transition-colors"
            aria-label="Lukk meny"
          >
            ✕
          </button>
        </div>
        <nav className="overflow-y-auto h-[calc(100vh-3.5rem)]">
          <ul className="py-2" role="list">
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
  // Check if this exact page is active
  const isActive = currentPath === item.href;

  // Check if current path is within this branch (for parent highlighting)
  const isInActiveTrail = !isActive && currentPath.startsWith(item.href + '/');

  const hasChildren = item.children && item.children.length > 0;

  // Consistent indentation: 12px per level (tighter for mobile)
  const indentStyle = {
    paddingLeft: `${12 + level * 12}px`,
  };

  return (
    <li role="listitem">
      <Link
        to={item.href}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        style={indentStyle}
        className={`
          group flex items-center gap-2 pr-4 py-2.5 text-xs font-medium uppercase tracking-[0.06em]
          border-l-2 transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
          ${
            isActive
              ? 'bg-foreground text-background border-l-foreground'
              : isInActiveTrail
                ? 'text-foreground border-l-muted-foreground'
                : 'text-muted-foreground border-l-transparent hover:bg-muted hover:text-foreground hover:border-l-border'
          }
        `}
      >
        {hasChildren && (
          <span
            aria-hidden="true"
            className={`
              flex-shrink-0 w-3 h-3 flex items-center justify-center
              ${isActive ? 'text-background' : 'text-muted-foreground'}
            `}
          >
            <span className="text-[0.5rem] font-bold">▼</span>
          </span>
        )}
        <span className={hasChildren ? '' : 'ml-5'}>{item.label}</span>
      </Link>

      {hasChildren && (
        <ul role="list">
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
