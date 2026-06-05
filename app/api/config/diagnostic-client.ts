import type { CreateClientConfig } from '../generated/diagnostic/client.gen';
import { createLoggedAxios } from './create-logged-axios';
import { getGatewayUrl } from './service-url';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: createLoggedAxios('diagnostic'),
  baseURL: getGatewayUrl(),
  throwOnError: true,
});
