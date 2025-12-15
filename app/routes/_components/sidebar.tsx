import { Link, useLocation } from 'react-router';
import { type RouteBranch } from '~/lib/route-tree';

type SidebarProps = {
  branches: RouteBranch[];
};

export function Sidebar({ branches }: SidebarProps) {
  const location = useLocation();

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <ul className="space-y-2 w-max" role="list">
        {branches.map((item) => (
          <SidebarItem key={item.id} item={item} currentPath={location.pathname} level={0} />
        ))}
      </ul>
    </div>
  );
}

type SidebarItemProps = {
  item: RouteBranch;
  currentPath: string;
  level: number;
};

function SidebarItem({ item, currentPath, level }: SidebarItemProps) {
  // Check if this exact page is active
  const isActive = currentPath === item.href;

  // Check if current path is within this branch (for parent highlighting)
  const isInActiveTrail = !isActive && currentPath.startsWith(item.href + '/');

  const hasChildren = item.children && item.children.length > 0;

  // Consistent indentation: 16px per level
  const indentStyle = {
    paddingLeft: `${level * 16}px`,
  };

  return (
    <li role="listitem">
      <Link
        to={item.href}
        aria-current={isActive ? 'page' : undefined}
        style={indentStyle}
        className={`
          group flex items-center gap-2 px-4 py-2 text-md font-medium
          border-l-2 transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
          ${
            isActive
              ? 'bg-foreground text-background border-l-foreground'
              : isInActiveTrail
                ? 'bg-muted text-foreground border-l-foreground'
                : 'text-foreground border-l-transparent hover:bg-muted hover:border-l-border'
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
            <span className="text-[0.65rem] font-bold">−</span>
          </span>
        )}
        <span className={hasChildren ? '' : 'ml-5'}>{item.label}</span>
      </Link>

      {hasChildren && (
        <ul className="space-y-0" role="list">
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} currentPath={currentPath} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
