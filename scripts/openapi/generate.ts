/* scripts/generate-api.ts */
import 'dotenv/config';
import { generate } from 'openapi-typescript-codegen';

import {
  BK_CLIENT,
  BK_DOCS,
  BK_OUT,
  CLIENTS_DIR,
  GEN_DIR,
  ID_CLIENT,
  ID_DOCS,
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
  console.log('⬇️  fetching OpenAPI specs…');
  const [identitySpec, bookingSpec]: [OAS, OAS] = await Promise.all([loadSpec(ID_DOCS), loadSpec(BK_DOCS)]);

  cleanDir(TMP_DIR);
  cleanDir(GEN_DIR);
  cleanDir(CLIENTS_DIR);
  cleanDir(TYPES_DIR);

  const identitySpecPath = writeJson(TMP_DIR, 'identity.openapi.json', identitySpec);
  const bookingSpecPath = writeJson(TMP_DIR, 'booking.openapi.json', bookingSpec);

  console.log('🛠️  generating raw clients to tmp…');
  await Promise.all([
    generate({
      input: identitySpecPath,
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

  console.log('📦 creating shared HTTP runtime…');
  createHttpRuntime(ID_OUT);

  console.log('🧬 synthesizing unified types…');
  synthesizeTypesAndZod(
    { identitySpec, bookingSpec },
    { identityOut: ID_OUT, bookingOut: BK_OUT },
    MIGRATION,
  );

  console.log('🧹 extracting services only & rewriting imports…');
  extractServicesAndRewrite('identity', ID_OUT, ID_CLIENT);
  extractServicesAndRewrite('booking', BK_OUT, BK_CLIENT);

  console.log('👷 creating single combined clients…');
  writeCombinedClient('identity', ID_CLIENT);
  writeCombinedClient('booking', BK_CLIENT);

  console.log('🗺️  writing migration map…');
  writeJson(TYPES_DIR, 'migration-map.json', MIGRATION);

  console.log(
    '✅ Done.\nOutput:\n  - app/api/clients/types (all types)\n  - app/api/clients/http (runtime)\n  - app/api/clients/{identity,booking}/services (services only)\n  - app/api/clients/{identity,booking}/client.ts (single client)\n',
  );
})().catch((err) => {
  console.error('❌ generation failed:', err);
  process.exit(1);
});
