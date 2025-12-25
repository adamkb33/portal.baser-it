import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createBaseClient } from '~/api/clients/base';
import { createBookingClient } from '~/api/clients/booking';
import { ENV } from '~/api/config/env';
import { getAccessTokenFromRequest } from './auth.utils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const baseApi = (accessToken?: string) =>
  createBaseClient({
    baseUrl: ENV.BASE_SERVICE_BASE_URL,
    token: accessToken,
  });

export const bookingApi = (accessToken?: string) =>
  createBookingClient({
    baseUrl: ENV.BOOKING_BASE_URL,
    token: accessToken,
  });

export const bookingServiceApi = async (request: Request) => {
  const accessToken = await getAccessTokenFromRequest(request);

  return createBookingClient({
    baseUrl: ENV.BOOKING_BASE_URL,
    token: accessToken,
  });
};
