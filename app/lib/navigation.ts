import { ROUTES } from './routes';

export interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const href = (p: string) => (p.startsWith('/') ? p : `/${p}`);
const link = (n: { label?: string; route: string }): NavLink => ({
  label: n.label ?? n.route,
  href: href(n.route),
});

export const MIDDLE_SECTION_NAV: NavLink[] = [
  link(ROUTES.user.profile),
  link(ROUTES.admin.dashboard),
  link(ROUTES.admin.company),
];

// End section (auth)
export const END_SECTION_NAV: NavLink[] = [
  link(ROUTES.auth.signIn),
  link(ROUTES.auth.signOut),
  link(ROUTES.auth.acceptInvite),
];
