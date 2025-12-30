import { describe, it, expect } from 'vitest';
import { createNavigation, Access, CompanyRole, UserRole, RoutePlaceMent } from '~/lib/route-tree';
import type { AuthenticatedUserPayload, CompanyDto, CompanyUserDto } from '~/api/generated/identity';

describe('createNavigation', () => {
  const mockAuthPayload: AuthenticatedUserPayload = {
    id: 1,
    email: 'test@example.com',
    companyId: 1,
  };

  const mockUser: CompanyUserDto = {
    givenName: 'Test',
    familyName: 'User',
    userId: 1,
    email: 'test@example.com',
    userRoles: [UserRole.USER, UserRole.COMPANY_USER],
    companyRoles: [CompanyRole.ADMIN],
  };

  const mockCompany: CompanyDto = {
    id: 1,
    orgNum: '123456789',
    products: ['BOOKING'],
  };

  describe('PUBLIC access', () => {
    it('should allow public routes for everyone', () => {
      const nav = createNavigation(undefined, undefined, undefined);

      // When not authenticated, should show sign-in link
      const signIn = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-in');
      expect(signIn).toBeDefined();
      expect(signIn?.accessType).toBe(Access.NOT_AUTHENTICATED);

      // Sidebar should be empty (no company routes without auth)
      expect(nav[RoutePlaceMent.SIDEBAR]).toEqual([]);
    });

    it('should show public routes even when authenticated', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      // Public routes are always accessible but don't appear in navigation placements
      expect(nav[RoutePlaceMent.NAVIGATION].length).toBeGreaterThan(0);
    });
  });

  describe('NOT_AUTHENTICATED access', () => {
    it('should show sign-in when not authenticated', () => {
      const nav = createNavigation(undefined, undefined, undefined);

      const signIn = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-in');
      expect(signIn).toBeDefined();
      expect(signIn?.label).toBe('Logg inn');
    });

    it('should hide sign-in when authenticated', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const signIn = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-in');
      expect(signIn).toBeUndefined();
    });
  });

  describe('AUTHENTICATED access', () => {
    it('should hide sign-out when not authenticated', () => {
      const nav = createNavigation(undefined, undefined, undefined);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeUndefined();
    });

    it('should show sign-out when authenticated', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeDefined();
      expect(signOut?.label).toBe('Logg ut');
    });

    it('should show sign-out with authPayload only (no user/company)', () => {
      const nav = createNavigation(mockAuthPayload, undefined, undefined);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeDefined();
    });

    it('should show user profile when authenticated', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const profile = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'user.profile');
      expect(profile).toBeDefined();
    });

    it('should show company context when authenticated', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const companyContext = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'user.company-context');
      expect(companyContext).toBeDefined();
    });

    it('should show authenticated routes even without company context', () => {
      const authWithoutCompany: AuthenticatedUserPayload = {
        id: 1,
        email: 'test@example.com',
      };

      const nav = createNavigation(authWithoutCompany, undefined, undefined);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeDefined();
    });
  });

  describe('ROLE access - ADMIN', () => {
    it('should show admin routes for ADMIN role', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const companyAdmin = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(companyAdmin).toBeDefined();

      // Check for admin-specific child routes
      const adminRoute = companyAdmin?.children?.find((c) => c.id === 'company.admin');
      expect(adminRoute).toBeDefined();
    });

    it('should show employees page for ADMIN', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const admin = company?.children?.find((c) => c.id === 'company.admin');
      const employees = admin?.children?.find((c) => c.id === 'company.admin.employees');

      expect(employees).toBeDefined();
      expect(employees?.label).toBe('Ansatte');
    });

    it('should hide admin routes for EMPLOYEE role', () => {
      const employeeUser: CompanyUserDto = {
        ...mockUser,
        companyRoles: [CompanyRole.EMPLOYEE],
      };

      const nav = createNavigation(mockAuthPayload, employeeUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const admin = company?.children?.find((c) => c.id === 'company.admin');

      expect(admin).toBeUndefined();
    });
  });

  describe('ROLE access - EMPLOYEE', () => {
    it('should show contacts for EMPLOYEE role', () => {
      const employeeUser: CompanyUserDto = {
        ...mockUser,
        companyRoles: [CompanyRole.EMPLOYEE],
      };

      const nav = createNavigation(mockAuthPayload, employeeUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeDefined();
    });

    it('should not show admin-only routes for EMPLOYEE', () => {
      const employeeUser: CompanyUserDto = {
        ...mockUser,
        companyRoles: [CompanyRole.EMPLOYEE],
      };

      const nav = createNavigation(mockAuthPayload, employeeUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const admin = company?.children?.find((c) => c.id === 'company.admin');
      const employees = admin?.children?.find((c) => c.id === 'company.admin.employees');

      expect(employees).toBeUndefined();
    });
  });

  describe('PRODUCT access', () => {
    it('should show booking routes when company has BOOKING product', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const booking = company?.children?.find((c) => c.id === 'company.booking');

      expect(booking).toBeDefined();
      expect(booking?.label).toBe('Booking');
    });

    it('should hide booking routes when company does not have BOOKING product', () => {
      const companyWithoutBooking: CompanyDto = {
        ...mockCompany,
        products: [],
      };

      const nav = createNavigation(mockAuthPayload, mockUser, companyWithoutBooking);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const booking = company?.children?.find((c) => c.id === 'company.booking');

      expect(booking).toBeUndefined();
    });

    it('should show booking admin routes for ADMIN with BOOKING product', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const booking = company?.children?.find((c) => c.id === 'company.booking');
      const bookingAdmin = booking?.children?.find((c) => c.id === 'company.booking.admin');

      expect(bookingAdmin).toBeDefined();
      expect(bookingAdmin?.label).toBe('Administrasjon');
    });

    it('should hide booking admin routes for EMPLOYEE', () => {
      const employeeUser: CompanyUserDto = {
        ...mockUser,
        companyRoles: [CompanyRole.EMPLOYEE],
      };

      const nav = createNavigation(mockAuthPayload, employeeUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const booking = company?.children?.find((c) => c.id === 'company.booking');
      const bookingAdmin = booking?.children?.find((c) => c.id === 'company.booking.admin');

      expect(bookingAdmin).toBeUndefined();
    });

    it('should show booking profile routes for EMPLOYEE', () => {
      const employeeUser: CompanyUserDto = {
        ...mockUser,
        companyRoles: [CompanyRole.EMPLOYEE],
      };

      const nav = createNavigation(mockAuthPayload, employeeUser, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const booking = company?.children?.find((c) => c.id === 'company.booking');
      const bookingProfile = booking?.children?.find((c) => c.id === 'company.booking.profile');

      expect(bookingProfile).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle null authPayload', () => {
      const nav = createNavigation(null, undefined, undefined);

      expect(nav[RoutePlaceMent.NAVIGATION]).toBeDefined();
      expect(nav[RoutePlaceMent.SIDEBAR]).toBeDefined();
      expect(nav[RoutePlaceMent.FOOTER]).toBeDefined();
    });

    it('should handle null user', () => {
      const nav = createNavigation(mockAuthPayload, null, mockCompany);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeDefined();

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeUndefined();
    });

    it('should handle null company', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, null);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeDefined();

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeUndefined();
    });

    it('should handle user with no roles', () => {
      const userWithNoRoles: CompanyUserDto = {
        ...mockUser,
        userRoles: [],
        companyRoles: [],
      };

      const nav = createNavigation(mockAuthPayload, userWithNoRoles, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeUndefined();
    });

    it('should handle company with multiple products', () => {
      const multiProductCompany: CompanyDto = {
        ...mockCompany,
        products: ['BOOKING', 'EVENT', 'TIMESHEET'],
      };

      const nav = createNavigation(mockAuthPayload, mockUser, multiProductCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      const booking = company?.children?.find((c) => c.id === 'company.booking');

      expect(booking).toBeDefined();
    });
  });

  describe('Hidden routes', () => {
    it('should not include hidden parent routes but should include their children', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, mockCompany);

      // 'auth' parent is hidden, but its children should be accessible
      const auth = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth');
      expect(auth).toBeUndefined();

      // But sign-out (child of auth) should be visible
      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeDefined();
    });
  });

  describe('Hierarchical access inheritance', () => {
    it('should require user for all ROLE routes', () => {
      const nav = createNavigation(mockAuthPayload, undefined, mockCompany);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeUndefined();
    });

    it('should require company for all ROLE routes', () => {
      const nav = createNavigation(mockAuthPayload, mockUser, undefined);

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeUndefined();
    });

    it('should require authPayload for all non-public routes', () => {
      const nav = createNavigation(undefined, mockUser, mockCompany);

      const signOut = nav[RoutePlaceMent.NAVIGATION].find((r) => r.id === 'auth.sign-out');
      expect(signOut).toBeUndefined();

      const company = nav[RoutePlaceMent.SIDEBAR].find((r) => r.id === 'company');
      expect(company).toBeUndefined();
    });
  });
});
