import type { CreateClientConfig } from '../generated/identity/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: import.meta.env.VITE_API_IDENTITY_SERVICE_URL || 'http://localhost:8080/identity-service',
});
