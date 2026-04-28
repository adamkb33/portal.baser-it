import type { CreateClientConfig } from '../generated/notification/client.gen';
import { createLoggedAxios } from './create-logged-axios';
import { getGatewayUrl } from './service-url';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: createLoggedAxios('notification', {
    withCredentials: true,
  }),
  baseURL: getGatewayUrl(),
  throwOnError: true,
  withCredentials: true,
});
