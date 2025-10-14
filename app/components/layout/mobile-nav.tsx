import React from "react";
import { NavLink } from "react-router";
import { Circle } from "lucide-react";

import type { NavItem } from "~/lib/navigation";

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  if (!items.length) {
    return null;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
    >
      <div className="mx-auto flex w-full max-w-[420px] items-center justify-between gap-2 px-6 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 text-sm font-medium">
        {items.map((link) => {
          const Icon = link.icon ?? Circle;
          return (
            <NavLink
              key={link.id}
              to={link.href}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 rounded-full px-3 py-1.5 transition",
                  isActive ? "bg-zinc-900 text-white shadow" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[0.75rem] leading-none">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
