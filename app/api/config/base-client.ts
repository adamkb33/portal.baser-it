import type { CreateClientConfig } from '../generated/base/client.gen';
import { createLoggedAxios } from './create-logged-axios';
import { getGatewayUrl } from './service-url';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: createLoggedAxios('base'),
  baseURL: getGatewayUrl(),
  throwOnError: true,
});
