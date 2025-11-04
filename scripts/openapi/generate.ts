/* scripts/generate-api.ts */
import 'dotenv/config';
import { generate } from 'openapi-typescript-codegen';

import {
  BK_CLIENT,
  BOOKING_DOCS,
  BK_OUT,
  CLIENTS_DIR,
  GEN_DIR,
  ID_CLIENT,
  BASE_DOCS,
  ID_OUT,
  TMP_DIR,
  TYPES_DIR,
} from './config';
import { writeCombinedClient } from './combined-client';
import { createHttpRuntime } from './http-runtime';
import { extractServicesAndRewrite } from './services-extractor';
import { cleanDir, writeJson } from './fs-utils';
import { loadSpec } from './spec-loader';
import { synthesizeTypesAndZod } from './types-synthesizer';
import type { MigrationMap, OAS } from './types';

const MIGRATION: MigrationMap = { merged: [], renamed: [], aliases: [] };

(async () => {
  console.info('⬇️  fetching OpenAPI specs…');
  const [baseSpec, bookingSpec]: [OAS, OAS] = await Promise.all([loadSpec(BASE_DOCS), loadSpec(BOOKING_DOCS)]);

  cleanDir(TMP_DIR);
  cleanDir(GEN_DIR);
  cleanDir(CLIENTS_DIR);
  cleanDir(TYPES_DIR);

  const baseSpecPath = writeJson(TMP_DIR, 'base.openapi.json', baseSpec);
  const bookingSpecPath = writeJson(TMP_DIR, 'booking.openapi.json', bookingSpec);

  console.info('🛠️  generating raw clients to tmp…');
  await Promise.all([
    generate({
      input: baseSpecPath,
      output: ID_OUT,
      httpClient: 'axios',
      useOptions: true,
      exportServices: true,
      exportSchemas: true,
    }),
    generate({
      input: bookingSpecPath,
      output: BK_OUT,
      httpClient: 'axios',
      useOptions: true,
      exportServices: true,
      exportSchemas: true,
    }),
  ]);

  console.info('📦 creating shared HTTP runtime…');
  createHttpRuntime(ID_OUT);

  console.info('🧬 synthesizing unified types…');
  synthesizeTypesAndZod({ baseSpec, bookingSpec }, { baseOut: ID_OUT, bookingOut: BK_OUT }, MIGRATION);

  console.info('🧹 extracting services only & rewriting imports…');
  extractServicesAndRewrite('base', ID_OUT, ID_CLIENT);
  extractServicesAndRewrite('booking', BK_OUT, BK_CLIENT);

  console.info('👷 creating single combined clients…');
  writeCombinedClient('base', ID_CLIENT);
  writeCombinedClient('booking', BK_CLIENT);

  console.info('🗺️  writing migration map…');
  writeJson(TYPES_DIR, 'migration-map.json', MIGRATION);

  console.info(
    '✅ Done.\nOutput:\n  - app/api/clients/types (all types)\n  - app/api/clients/http (runtime)\n  - app/api/clients/{base,booking}/services (services only)\n  - app/api/clients/{base,booking}/client.ts (single client)\n',
  );
})().catch((err) => {
  console.error('❌ generation failed:', err);
  process.exit(1);
});
