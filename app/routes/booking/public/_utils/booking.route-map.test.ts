import { describe, expect, it } from 'vitest';
import { getBookingRouteHref, getBookingRouteMap } from './booking.route-map';

describe('booking route map', () => {
  it('resolves public booking routes', () => {
    const routes = getBookingRouteMap();

    expect(routes.appointment).toBe('/booking/public/appointment');
    expect(routes.contact).toBe('/booking/public/appointment/session/contact');
    expect(routes.contactSignIn).toBe('/booking/public/appointment/session/contact/sign-in');
    expect(routes.employee).toBe('/booking/public/appointment/session/employee');
    expect(routes.myAppointments).toBe('/booking/public/my-appointments');
  });

  it('resolves a single route href by key', () => {
    expect(getBookingRouteHref('overview')).toBe('/booking/public/appointment/session/overview');
  });
});
