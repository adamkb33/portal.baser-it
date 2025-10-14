import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { HTTP_DIR } from './config';

export function createHttpRuntime(sourceRoot: string) {
  mkdirSync(HTTP_DIR, { recursive: true });
  const coreDir = join(sourceRoot, 'core');
  const files = [
    ['CancelablePromise.ts', 'CancelablePromise.ts'],
    ['ApiError.ts', 'errors.ts'],
    ['ApiRequestOptions.ts', 'ApiRequestOptions.ts'],
    ['ApiResult.ts', 'ApiResult.ts'],
    ['OpenAPI.ts', 'OpenAPI.ts'],
    ['request.ts', 'request.ts'],
  ] as const;

  for (const [srcName, outName] of files) {
    const src = join(coreDir, srcName);
    if (!existsSync(src)) continue;
    let code = readFileSync(src, 'utf-8');

    if (srcName === 'ApiError.ts') {
      code = code
        .replace(/\bclass\s+ApiError\b/g, 'class ApiClientError')
        .replace(/\bexport\s+class\s+ApiError\b/g, 'export class ApiClientError')
        .replace(/\bexport\s+\{\s*ApiError\s*\}/g, 'export { ApiClientError }')
        .replace(/\bApiError\b/g, 'ApiClientError');
    }

    if (srcName === 'request.ts') {
      code = code.replace(`import { ApiError } from './ApiError';\n`, `import { ApiClientError } from './errors';\n`);
      code = code.replace(/\bApiError\b/g, 'ApiClientError');
      code = code.replace(`import type { OpenAPIConfig } from './OpenAPI';\n`, '');
      const anchor = `import type { OnCancel } from './CancelablePromise';\n`;
      if (code.includes(anchor)) {
        const typeDef =
          `\nexport type OpenAPIConfig = {\n` +
          `  BASE: string;\n  VERSION: string;\n  WITH_CREDENTIALS: boolean;\n  CREDENTIALS: 'include' | 'omit' | 'same-origin';\n` +
          `  TOKEN?: string | ((options: ApiRequestOptions) => Promise<string>);\n` +
          `  USERNAME?: string | ((options: ApiRequestOptions) => Promise<string>);\n` +
          `  PASSWORD?: string | ((options: ApiRequestOptions) => Promise<string>);\n` +
          `  HEADERS?: Record<string, string> | ((options: ApiRequestOptions) => Promise<Record<string, string>>);\n` +
          `  ENCODE_PATH?: (path: string) => string;\n};\n`;
        code = code.replace(anchor, `${anchor}${typeDef}`);
      }
      code += `
export let __BASE__ = '';
export let __TOKEN__: string | undefined;

export function setBaseUrl(base: string) { __BASE__ = base; }
export function setAuth(token?: string) { __TOKEN__ = token; }
`;
      code = code.replace(/config\.BASE/g, '__BASE__ || config.BASE');
      code = code.replace(/config\.TOKEN/g, '__TOKEN__ !== undefined ? __TOKEN__ : config.TOKEN');
    }

    writeFileSync(join(HTTP_DIR, outName), code);
  }

  const idx = `export { CancelablePromise } from './CancelablePromise';
export { ApiClientError } from './errors';
export { OpenAPI } from './OpenAPI';
export { request, setAuth, setBaseUrl } from './request';
export type { ApiRequestOptions } from './ApiRequestOptions';
export type { ApiResult } from './ApiResult';
`;
  writeFileSync(join(HTTP_DIR, 'index.ts'), idx);
}
