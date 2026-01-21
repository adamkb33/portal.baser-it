import type { CreateClientConfig } from '../generated/booking/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: import.meta.env.VITE_API_BOOKING_SERVICE_URL || 'http://localhost:8080/booking-service',
  throwOnError: true,
});
