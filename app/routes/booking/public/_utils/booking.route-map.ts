import { ROUTES_MAP } from '~/lib/routing/route-tree';

export type BookingRouteKey =
  | 'session'
  | 'appointment'
  | 'entry'
  | 'contact'
  | 'contactSignIn'
  | 'contactSignUp'
  | 'contactVerifyEmail'
  | 'contactVerifyMobile'
  | 'contactCollectEmail'
  | 'contactCollectMobile'
  | 'employee'
  | 'selectServices'
  | 'selectTime'
  | 'overview'
  | 'success'
  | 'cancel'
  | 'myAppointments';

export type BookingRouteMap = Record<BookingRouteKey, string>;

type BookingRouteIdMap = Record<BookingRouteKey, string>;

const BOOKING_ROUTE_IDS: BookingRouteIdMap = {
  session: 'booking.public.appointment.session',
  appointment: 'booking.public.appointment',
  entry: 'booking.public.appointment.session',
  contact: 'booking.public.appointment.session.contact',
  contactSignIn: 'booking.public.appointment.session.contact.sign-in',
  contactSignUp: 'booking.public.appointment.session.contact.sign-up',
  contactVerifyEmail: 'booking.public.appointment.session.contact.verify-email',
  contactVerifyMobile: 'booking.public.appointment.session.contact.verify-mobile',
  contactCollectEmail: 'booking.public.appointment.session.contact.collect-email',
  contactCollectMobile: 'booking.public.appointment.session.contact.collect-mobile',
  employee: 'booking.public.appointment.session.employee',
  selectServices: 'booking.public.appointment.session.select-services',
  selectTime: 'booking.public.appointment.session.select-time',
  overview: 'booking.public.appointment.session.overview',
  success: 'booking.public.appointment.success',
  cancel: 'booking.public.appointment.cancel',
  myAppointments: 'booking.public.my-appointments',
};

function requireRouteHref(routeId: string): string {
  const route = ROUTES_MAP[routeId];

  if (!route) {
    throw new Error(`Missing booking route id: ${routeId}`);
  }

  return route.href;
}

export function getBookingRouteMap(): BookingRouteMap {
  return Object.fromEntries(
    Object.entries(BOOKING_ROUTE_IDS).map(([key, routeId]) => [key, requireRouteHref(routeId)]),
  ) as BookingRouteMap;
}

export function getBookingRouteHref(key: BookingRouteKey): string {
  return getBookingRouteMap()[key];
}
