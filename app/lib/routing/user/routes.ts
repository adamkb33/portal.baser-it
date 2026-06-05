import { Access, BrachCategory, RoutePlaceMent, type RouteBranch } from '../route-types';

export const USER_ROUTES: RouteBranch[] = [
  {
      id: 'user',
      href: '/user',
      label: 'Bruker',
      category: BrachCategory.USER,
      accessType: Access.PUBLIC,
      hidden: true,
      iconName: 'UserCircle',
      children: [
        {
          id: 'user.profile',
          href: '/user/profile',
          label: 'Min profil',
          category: BrachCategory.USER,
          placement: RoutePlaceMent.NAVIGATION,
          accessType: Access.AUTHENTICATED,
          iconName: 'UserCircle',
        },
        {
          id: 'user.company-context',
          href: '/user/company-context',
          label: 'Mine selskap',
          category: BrachCategory.USER,
          placement: RoutePlaceMent.NAVIGATION,
          accessType: Access.AUTHENTICATED,
          iconName: 'Building2',
        },
      ],
    }
];
