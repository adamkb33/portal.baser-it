import { describe, expect, it } from 'vitest';
import type { RouteBranch } from './route-types';
import { Access, BrachCategory } from './route-types';
import { buildRoutesNested } from './routes-builder';

describe('buildRoutesNested', () => {
  it('uses child paths relative to the parent route instead of duplicating absolute hrefs', () => {
    const routeTree: RouteBranch[] = [
      {
        id: 'booking',
        href: '/booking',
        category: BrachCategory.PUBLIC,
        accessType: Access.PUBLIC,
        children: [
          {
            id: 'booking.public',
            href: '/booking/public',
            category: BrachCategory.PUBLIC,
            accessType: Access.PUBLIC,
            children: [
              {
                id: 'booking.public.appointment',
                href: '/booking/public/appointment',
                category: BrachCategory.PUBLIC,
                accessType: Access.PUBLIC,
                children: [
                  {
                    id: 'booking.public.appointment.session',
                    href: '/booking/public/appointment/session',
                    category: BrachCategory.PUBLIC,
                    accessType: Access.PUBLIC,
                    children: [
                      {
                        id: 'booking.public.appointment.session.contact',
                        href: '/booking/public/appointment/session/contact',
                        category: BrachCategory.NONE,
                        accessType: Access.PUBLIC,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const bookingRoute = buildRoutesNested(routeTree)[0];
    const publicRoute = bookingRoute.children?.[1];
    const appointmentRoute = publicRoute?.children?.[1];
    const sessionRoute = appointmentRoute?.children?.[1];
    const contactRoute = sessionRoute?.children?.[1];

    expect(bookingRoute.path).toBe('booking');
    expect(publicRoute?.path).toBe('public');
    expect(appointmentRoute?.path).toBe('appointment');
    expect(sessionRoute?.path).toBe('session');
    expect(contactRoute?.path).toBe('contact');
  });
});
