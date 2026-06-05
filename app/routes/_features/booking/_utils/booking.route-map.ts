import { ROUTES_MAP } from '~/lib/routing/route-tree';
import type { BookingSurface } from './booking.surface';

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

const PUBLIC_BOOKING_ROUTE_IDS: BookingRouteIdMap = {
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

const EMBED_BOOKING_ROUTE_IDS: BookingRouteIdMap = {
  session: 'embed.booking.appointment.session',
  appointment: 'embed.booking.appointment',
  entry: 'embed.booking.appointment.session',
  contact: 'embed.booking.appointment.session.contact',
  contactSignIn: 'embed.booking.appointment.session.contact.sign-in',
  contactSignUp: 'embed.booking.appointment.session.contact.sign-up',
  contactVerifyEmail: 'embed.booking.appointment.session.contact.verify-email',
  contactVerifyMobile: 'embed.booking.appointment.session.contact.verify-mobile',
  contactCollectEmail: 'embed.booking.appointment.session.contact.collect-email',
  contactCollectMobile: 'embed.booking.appointment.session.contact.collect-mobile',
  employee: 'embed.booking.appointment.session.employee',
  selectServices: 'embed.booking.appointment.session.select-services',
  selectTime: 'embed.booking.appointment.session.select-time',
  overview: 'embed.booking.appointment.session.overview',
  success: 'embed.booking.appointment.success',
  cancel: 'embed.booking.appointment.cancel',
  myAppointments: 'embed.booking.my-appointments',
};

const BOOKING_ROUTE_IDS_BY_SURFACE: Record<BookingSurface, BookingRouteIdMap> = {
  public: PUBLIC_BOOKING_ROUTE_IDS,
  embed: EMBED_BOOKING_ROUTE_IDS,
};

function requireRouteHref(routeId: string): string {
  const route = ROUTES_MAP[routeId];

  if (!route) {
    throw new Error(`Missing booking route id: ${routeId}`);
  }

  return route.href;
}

export function getBookingRouteMap(surface: BookingSurface): BookingRouteMap {
  const routeIds = BOOKING_ROUTE_IDS_BY_SURFACE[surface];

  return Object.fromEntries(
    Object.entries(routeIds).map(([key, routeId]) => [key, requireRouteHref(routeId)]),
  ) as BookingRouteMap;
}

export function getBookingRouteHref(surface: BookingSurface, key: BookingRouteKey): string {
  return getBookingRouteMap(surface)[key];
}
