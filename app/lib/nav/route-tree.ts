enum Access {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

type RouteBranch = {
  id: string;
  children?: RouteBranch[];
  access?: string[];
};

const tree: RouteBranch[] = [
  {
    id: 'auth.sign-in',
  },
  {
    id: 'auth.sign-up',
  },
  {
    id: 'auth.forgot-password',
  },
  {
    id: 'auth.dashboard',
    children: [
      {
        id: 'auth.dashboard.analytics',
      },
      {
        id: 'auth.dashboard.reports',
      },
    ],
  },
];

const resolveAccessType = (accessType: Access) => {
  switch (accessType) {
    case Access.PUBLIC:
      return 'requries no authentication';
    case Access.AUTHENTICATED:
      return 'requires user to be authenticated';
    default:
      return 'requires user to have role ' + accessType;
  }
};

const generateRoutes = () => {};
