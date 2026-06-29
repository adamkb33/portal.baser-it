// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

const gatewayUrl = (process.env.VITE_API_GATEWAY_URL || 'http://localhost:8010').replace(/\/+$/, '');
const groupedDocsUrl = (groupName: string) => `${gatewayUrl}/v3/api-docs/${groupName}`;

export default defineConfig([
  {
    client: '@hey-api/client-axios',
    input: groupedDocsUrl('base-service'),
    output: './app/api/generated/base',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/base-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
  {
    client: '@hey-api/client-axios',
    input: groupedDocsUrl('booking-service'),
    output: './app/api/generated/booking',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/booking-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
  {
    client: '@hey-api/client-axios',
    input: groupedDocsUrl('timesheet-service'),
    output: './app/api/generated/timesheet',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/timesheet-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
  {
    client: '@hey-api/client-axios',
    input: groupedDocsUrl('notification-service'),
    output: './app/api/generated/notification',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/notification-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
  {
    client: '@hey-api/client-axios',
    input: groupedDocsUrl('diagnostic-service'),
    output: './app/api/generated/diagnostic',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/diagnostic-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
  {
    client: '@hey-api/client-axios',
    input: groupedDocsUrl('offer-service'),
    output: './app/api/generated/offer',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/offer-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
]);
