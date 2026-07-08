import { describe, expect, it } from 'vitest';
import { BrachCategory, type RouteBranch } from '~/lib/routing/route-tree';
import {
  getInitialDrawerStack,
  getMobileNavPage,
  getPageIndexForBranch,
  matchesBranchPath,
  shouldCloseOnLeafSelection,
  shouldStayWithinBranch,
} from '~/routes/_components/mobile-sidebar/mobile-sidebar';

function branch(overrides: Partial<RouteBranch> = {}): RouteBranch {
  return {
    id: 'branch',
    href: '/branch',
    label: 'Branch',
    category: BrachCategory.COMPANY,
    ...overrides,
  };
}

describe('mobile sidebar helpers', () => {
  it('matches parameterized hidden route hrefs', () => {
    expect(matchesBranchPath('/company/notifications/123', '/company/notifications/:id')).toBe(true);
    expect(matchesBranchPath('/company/timesheets/range/42', '/company/timesheets/range/:id')).toBe(true);
    expect(matchesBranchPath('/company/notifications', '/company/notifications/:id')).toBe(false);
  });

  it('uses four real items plus a paging control when routes overflow', () => {
    const branches = ['one', 'two', 'three', 'four', 'five', 'six'].map((id, index) =>
      branch({ id, href: `/${id}`, label: `Route ${index + 1}` }),
    );

    const page = getMobileNavPage(branches, 0, 5);

    expect(page.items.map((item) => item.id)).toEqual(['one', 'two', 'three', 'four']);
    expect(page.hasOverflow).toBe(true);
    expect(page.controlLabel).toBe('Mer');
  });

  it('resets the paging control label on the final page', () => {
    const branches = ['one', 'two', 'three', 'four', 'five', 'six'].map((id) =>
      branch({ id, href: `/${id}`, label: id }),
    );

    const page = getMobileNavPage(branches, 1, 5);

    expect(page.items.map((item) => item.id)).toEqual(['five', 'six']);
    expect(page.controlLabel).toBe('Start');
  });

  it('computes the correct page for the active primary branch', () => {
    const branches = ['one', 'two', 'three', 'four', 'five', 'six'].map((id) =>
      branch({ id, href: `/${id}`, label: id }),
    );

    expect(getPageIndexForBranch(branches, 'one', 5)).toBe(0);
    expect(getPageIndexForBranch(branches, 'five', 5)).toBe(1);
  });

  it('keeps visible drilldown ancestors but excludes the root branch', () => {
    const serviceGroups = branch({
      id: 'company.booking.admin.service-groups',
      href: '/company/booking/admin/service-groups',
      children: [
        branch({
          id: 'company.booking.admin.service-groups.services',
          href: '/company/booking/admin/service-groups/services',
          children: [
            branch({ id: 'company.booking.admin.service-groups.services.create', href: '/create', hidden: true }),
          ],
        }),
      ],
    });
    const bookingAdmin = branch({
      id: 'company.booking.admin',
      href: '/company/booking/admin',
      children: [serviceGroups],
    });
    const booking = branch({
      id: 'company.booking',
      href: '/company/booking',
      children: [bookingAdmin],
    });
    const trail = [
      { node: branch({ id: 'company', href: '/company', children: [booking] }), level: 0 },
      { node: booking, level: 1 },
      { node: bookingAdmin, level: 2 },
      { node: serviceGroups, level: 3 },
    ];

    expect(getInitialDrawerStack(trail, 'company').map((item) => item.id)).toEqual([
      'company.booking',
      'company.booking.admin',
      'company.booking.admin.service-groups',
    ]);
  });

  it('does not navigate back to a branch root when already inside that branch', () => {
    const booking = branch({
      id: 'company.booking',
      href: '/company/booking',
      children: [branch({ id: 'company.booking.profile', href: '/company/booking/profile' })],
    });

    expect(shouldStayWithinBranch('/company/booking/profile', booking)).toBe(true);
    expect(shouldStayWithinBranch('/company/timesheets/register', booking)).toBe(false);
  });

  it('closes the drawer for terminal targets and keeps non-terminal branches open', () => {
    const activeLeaf = branch({ id: 'company.booking.profile', href: '/company/booking/profile' });
    const parent = branch({
      id: 'company.booking',
      href: '/company/booking',
      children: [activeLeaf],
    });

    expect(shouldCloseOnLeafSelection(activeLeaf)).toBe(true);
    expect(shouldCloseOnLeafSelection(parent)).toBe(false);
  });
});
