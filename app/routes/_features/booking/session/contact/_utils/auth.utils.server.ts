import { redirect } from 'react-router';

import { verificationSessionToken } from '~/lib/auth.server';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';

export async function requireVerificationToken(request: Request, surface: BookingSurface = 'public') {
  const routes = getBookingRouteMap(surface);
  const cookieHeader = request.headers.get('Cookie');
  const token = await verificationSessionToken.parse(cookieHeader);
  if (!token || typeof token !== 'string') {
    return redirect(routes.contact);
  }
  return token;
}

export const getVerificationTokenFromRequest = async (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');
  const token = await verificationSessionToken.parse(cookieHeader);
  if (!token || typeof token !== 'string') {
    return null;
  }
  return token;
};
