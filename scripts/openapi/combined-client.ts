import { basename, join } from 'node:path';
import { writeFileSync } from 'node:fs';

import { listFiles } from './fs-utils';
import { pascal } from './text-utils';
import type { ApiName } from './types';

export function writeCombinedClient(api: ApiName, apiRoot: string) {
  const files = listFiles(join(apiRoot, 'services'), '.ts');
  const serviceNames = files.map((f) => basename(f).replace(/\.ts$/, '')).filter((n) => !n.endsWith('index'));
  const lines: string[] = [];
  for (const n of serviceNames) lines.push(`export { ${n} } from './services/${n}';`);

  const clientFactory = `
import { setAuth, setBaseUrl } from '@http';
${serviceNames.map((n) => `import * as ${n} from './services/${n}';`).join('\n')}

export type ${pascal(api)}Client = {
  ${serviceNames.map((n) => `${n}: typeof ${n}`).join(';\n  ')}
};

export function create${pascal(api)}Client(opts: { baseUrl: string; token?: string }): ${pascal(api)}Client {
  setBaseUrl(opts.baseUrl);
  setAuth(opts.token);
  return {
    ${serviceNames.map((n) => `${n}`).join(',\n    ')}
  };
}
`;
  writeFileSync(join(apiRoot, 'client.ts'), clientFactory);
  writeFileSync(join(apiRoot, 'OpenAPI.ts'), `export { OpenAPI } from '@http';\n`);
  const indexLines = [
    ...lines,
    `export * from './client';`,
    `export * from '@types';`,
    `export { OpenAPI } from './OpenAPI';`,
  ];
  writeFileSync(join(apiRoot, 'index.ts'), indexLines.join('\n') + '\n');
}
