import { describe, expect, it } from 'vitest';
import { getBookingRouteHref, getBookingRouteMap } from './booking.route-map';

describe('booking route map', () => {
  it('resolves public booking routes under the public namespace', () => {
    const routes = getBookingRouteMap('public');

    expect(routes.appointment).toBe('/booking/public/appointment');
    expect(routes.contact).toBe('/booking/public/appointment/session/contact');
    expect(routes.contactSignIn).toBe('/booking/public/appointment/session/contact/sign-in');
    expect(routes.employee).toBe('/booking/public/appointment/session/employee');
    expect(routes.myAppointments).toBe('/booking/public/my-appointments');
  });

  it('resolves embedded booking routes under the embed namespace', () => {
    const routes = getBookingRouteMap('embed');

    expect(routes.appointment).toBe('/embed/booking/appointment');
    expect(routes.contact).toBe('/embed/booking/appointment/session/contact');
    expect(routes.contactSignIn).toBe('/embed/booking/appointment/session/contact/sign-in');
    expect(routes.employee).toBe('/embed/booking/appointment/session/employee');
    expect(routes.myAppointments).toBe('/embed/booking/my-appointments');
  });

  it('resolves a single route href by surface and key', () => {
    expect(getBookingRouteHref('public', 'overview')).toBe('/booking/public/appointment/session/overview');
    expect(getBookingRouteHref('embed', 'overview')).toBe('/embed/booking/appointment/session/overview');
  });
});
