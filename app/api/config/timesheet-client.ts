import type { CreateClientConfig } from '../generated/timesheet/client.gen';
import { createLoggedAxios } from './create-logged-axios';
import { getGatewayUrl } from './service-url';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: createLoggedAxios('timesheet'),
  baseURL: getGatewayUrl(),
  throwOnError: true,
});
