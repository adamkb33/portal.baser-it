import type { CreateClientConfig } from '../generated/base/client.gen';
import { createLoggedAxios } from './create-logged-axios';
import { getGatewayUrl } from './service-url';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: createLoggedAxios('offer'),
  baseURL: getGatewayUrl(),
  throwOnError: true,
});
