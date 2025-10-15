import type { NavItem } from '~/lib/navigation/functions';
import { NavLink } from './nav-link';

export function SidebarNav({ items }: { items: NavItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed border-zinc-200 p-4 text-sm text-zinc-600">
        No sidebar links configured.
      </div>
    );
  }

  return (
    <nav className="space-y-2">
      {items.map((item) => (
        <SidebarItem key={item.id} item={item} depth={0} />
      ))}
    </nav>
  );
}

export function SidebarItem({ item, depth }: { item: NavItem; depth: number }) {
  const hasChildren = Boolean(item.children?.length);
  return (
    <div className="space-y-1">
      <NavLink
        link={{
          href: item.href,
          label: item.label,
        }}
      />

      {hasChildren ? (
        <div className="space-y-1 pl-3">
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
