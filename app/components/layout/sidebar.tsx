import type { NavItem } from '~/lib/navigation/functions';
import { NavLink } from './nav-link';
import type { RouteBranch } from '~/lib/nav/route-tree';

export function SidebarNav({ items }: { items: RouteBranch[] | undefined }) {
  if (!items?.length) {
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

export function SidebarItem({ item, depth }: { item: RouteBranch; depth: number }) {
  const hasChildren = Boolean(item.children?.length);
  return (
    <div className="space-y-2">
      <NavLink
        className={`block rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-200 ${
          depth > 0 ? 'text-zinc-700' : 'text-zinc-900'
        }`}
        activeClassName="bg-zinc-300 text-zinc-900 font-semibold"
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
