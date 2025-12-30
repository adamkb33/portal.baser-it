// openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig([
  {
    client: '@hey-api/client-axios',
    input: process.env.VITE_API_IDENTITY_SERVICE_DOCS_URL || 'http://localhost:8080/identity-service/api-docs',
    output: './app/api/generated/identity',
    plugins: [
      {
        name: '@hey-api/client-axios',
        runtimeConfigPath: '~/api/config/identity-client',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
  },
  {
    client: '@hey-api/client-axios',
    input: process.env.VITE_API_BOOKING_SERVICE_DOCS_URL || 'http://localhost:8080/booking-service/api-docs',
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
]);
