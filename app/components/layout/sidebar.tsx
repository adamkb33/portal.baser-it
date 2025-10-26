import { useState } from 'react';
import { NavLink } from './nav-link';

export function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Mobile top bar (explicit height) */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b h-12">
        <button className="h-full px-3" onClick={() => setOpen((v) => !v)} aria-label="Toggle sidebar">
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={[
          // positioning
          'fixed md:sticky left-0 z-30 md:z-auto',
          // offset + height
          // mobile: below the 3rem top bar; desktop: full viewport height, top-0
          'top-12 md:top-0',
          'h-[calc(100dvh-3rem)] md:h-[100dvh]',
          // width + look
          'w-64 shrink-0 bg-white border-r overflow-y-auto',
          // slide-in on mobile
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'transition-transform',
        ].join(' ')}
      >
        <nav className="p-3 space-y-1">
          <NavLink link={{ href: '/dashboard', label: 'Dashboard' }} />
          <NavLink link={{ href: '/settings', label: 'Settings' }} />
          <NavLink link={{ href: '/profile', label: 'Profile' }} />
        </nav>
      </aside>

      {open && <div className="fixed inset-0 bg-black/20 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
