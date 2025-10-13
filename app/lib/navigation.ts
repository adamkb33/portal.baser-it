export interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Sign In', href: '/sign-in' },
];

export const END_SECTION_NAV_LINKS = {
  AUTH: [],
  NO_AUTH: [],
};

const AUTH_ROUTES = {
  MY_PROFILE: {
    label: 'Min profil',
    href: 'my-profile',
  },
  SIGN_OUT: {
    label: 'Logg ut',
    href: 'sign-out',
  },
};
