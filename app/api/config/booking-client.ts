import type { CreateClientConfig } from '../generated/booking/client.gen';
import { createLoggedAxios } from './create-logged-axios';
import { getGatewayUrl } from './service-url';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: createLoggedAxios('booking'),
  baseURL: getGatewayUrl(),
  throwOnError: true,
});
