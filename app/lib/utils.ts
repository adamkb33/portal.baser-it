import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createBaseClient } from '~/api/clients/base';
import { createBookingClient } from '~/api/clients/booking';
import { ENV } from '~/api/config/env';

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
