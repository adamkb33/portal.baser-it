/* scripts/generate-api.ts */
import 'dotenv/config';
import axios from 'axios';
import { generate } from 'openapi-typescript-codegen';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, relative, isAbsolute, basename } from 'node:path';
import crypto from 'node:crypto';

type OAS = any;

type ApiName = 'identity' | 'booking';

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing required env: ${key}`);
  return value;
};

const ID_DOCS = getEnv('VITE_API_IDENTITY_DOCS_URL');
const BK_DOCS = getEnv('VITE_API_BOOKING_DOCS_URL');

const ROOT = process.cwd();
const TMP_DIR = join(ROOT, 'tmp', 'openapi');
const GEN_DIR = join(TMP_DIR, 'gen'); // generator outputs
const OUT_ROOT = join(ROOT, 'app', 'api');
const CLIENTS_DIR = join(OUT_ROOT, 'clients');
const TYPES_DIR = join(OUT_ROOT, 'types');
const HTTP_DIR = join(CLIENTS_DIR, 'http');

const ID_OUT = join(GEN_DIR, 'identity');
const BK_OUT = join(GEN_DIR, 'booking');

const ID_CLIENT = join(CLIENTS_DIR, 'identity');
const BK_CLIENT = join(CLIENTS_DIR, 'booking');

type MigrationMap = {
  merged: string[];
  renamed: Array<{ from: string; to: string; reason: 'collision' | 'namespace' }>;
  aliases: Array<{ alias: string; target: string }>;
};

const MIGRATION: MigrationMap = { merged: [], renamed: [], aliases: [] };

/* ----------------------------- entrypoint ------------------------------ */
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

  console.log('🧬 synthesizing unified types + zod…');
  synthesizeTypesAndZod({ identitySpec, bookingSpec }, { identityOut: ID_OUT, bookingOut: BK_OUT });

  console.log('🧹 extracting services only & rewriting imports…');
  extractServicesAndRewrite('identity', ID_OUT, ID_CLIENT);
  extractServicesAndRewrite('booking', BK_OUT, BK_CLIENT);

  console.log('👷 creating single combined clients…');
  writeCombinedClient('identity', ID_CLIENT);
  writeCombinedClient('booking', BK_CLIENT);

  console.log('🗺️  writing migration map…');
  writeJson(TYPES_DIR, 'migration-map.json', MIGRATION);

  console.log(
    '✅ Done.\nOutput:\n  - app/api/types (all types + zod)\n  - app/api/clients/http (runtime)\n  - app/api/clients/{identity,booking}/services (services only)\n  - app/api/clients/{identity,booking}/client.ts (single client)\n',
  );
})().catch((err) => {
  console.error('❌ generation failed:', err);
  process.exit(1);
});

/* ------------------------------- helpers -------------------------------- */

async function loadSpec(source: string): Promise<OAS> {
  if (/^https?:\/\//i.test(source)) {
    const response = await axios.get(source, { timeout: 30000 });
    return response.data;
  }
  if (source.startsWith('file://')) source = source.replace('file://', '');
  const filePath = isAbsolute(source) ? source : join(ROOT, source);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJson(dir: string, name: string, data: any) {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(data, null, 2));
  return p;
}

function cleanDir(dir: string) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

function listFiles(root: string, ext = '.ts') {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const fp = join(d, entry.name);
      if (entry.isDirectory()) walk(fp);
      else if (entry.isFile() && fp.endsWith(ext)) out.push(fp);
    }
  };
  if (existsSync(root)) walk(root);
  return out;
}

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const normalizeText = (s: string) => stripComments(s).replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

const pascal = (s: string) =>
  s
    .replace(/[_\-\s]+/g, ' ')
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
    .replace(/[^\w]/g, '');

/* -------------------------- HTTP runtime (shared) ----------------------- */

function createHttpRuntime(sourceRoot: string) {
  mkdirSync(HTTP_DIR, { recursive: true });
  // take core from identity
  const coreDir = join(sourceRoot, 'core');
  const files = [
    ['CancelablePromise.ts', 'CancelablePromise.ts'],
    ['BaseHttpRequest.ts', 'BaseHttpRequest.ts'],
    ['AxiosHttpRequest.ts', 'http.ts'],
    ['ApiError.ts', 'errors.ts'],
    ['request.ts', 'request.ts'],
  ] as const;

  for (const [srcName, outName] of files) {
    const src = join(coreDir, srcName);
    if (!existsSync(src)) continue;
    let code = readFileSync(src, 'utf-8');

    if (srcName === 'ApiError.ts') {
      // rename class to avoid colliding with schema "ApiError"
      code = code
        .replace(/\bclass\s+ApiError\b/g, 'class ApiClientError')
        .replace(/\bexport\s+class\s+ApiError\b/g, 'export class ApiClientError')
        .replace(/\bexport\s+\{\s*ApiError\s*\}/g, 'export { ApiClientError }')
        .replace(/\bApiError\b/g, 'ApiClientError');
    }

    // inline OpenAPIConfig type in request.ts (stable)
    if (srcName === 'request.ts') {
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
      // add simple auth/base setters
      code += `
export let __BASE__ = '';
export let __TOKEN__: string | undefined;

export function setBaseUrl(base: string) { __BASE__ = base; }
export function setAuth(token?: string) { __TOKEN__ = token; }
`;
      // patch request defaults if OpenAPI object is used internally
      code = code.replace(/OpenAPI\.BASE/g, '__BASE__ || OpenAPI.BASE');
      code = code.replace(/OpenAPI\.TOKEN/g, '__TOKEN__ !== undefined ? __TOKEN__ : OpenAPI.TOKEN');
    }

    writeFileSync(join(HTTP_DIR, outName), code);
  }

  // index surface
  const idx = `export { CancelablePromise } from './CancelablePromise';
export { ApiClientError } from './errors';
export { setAuth, setBaseUrl } from './request';
export * from './http';
`;
  writeFileSync(join(HTTP_DIR, 'index.ts'), idx);
}

/* ------------------------ Types + Zod synthesizer ----------------------- */

type SpecPack = { identitySpec: OAS; bookingSpec: OAS };
type GenPack = { identityOut: string; bookingOut: string };

// primitive decisions
const PRIMITIVES = {
  Email: { ts: 'string', zod: `z.string().email()` },
  ID: { ts: 'string', zod: `z.union([z.string(), z.number()])` }, // change to string-only if you prefer
  DateTime: { ts: 'string', zod: `z.string().datetime()` },
};

function synthesizeTypesAndZod(specs: SpecPack, gens: GenPack) {
  // scaffold folders
  const folders = [
    TYPES_DIR,
    join(TYPES_DIR, 'primitives'),
    join(TYPES_DIR, 'enums'),
    join(TYPES_DIR, 'models'),
    join(TYPES_DIR, 'wrappers'),
    join(TYPES_DIR, 'zod'),
    join(TYPES_DIR, 'zod', 'primitives'),
    join(TYPES_DIR, 'zod', 'enums'),
    join(TYPES_DIR, 'zod', 'models'),
    join(TYPES_DIR, 'zod', 'wrappers'),
    join(TYPES_DIR, '(generated)'),
  ];
  folders.forEach((d) => mkdirSync(d, { recursive: true }));

  // 1) primitives
  for (const [name, def] of Object.entries(PRIMITIVES)) {
    writeFileSync(join(TYPES_DIR, 'primitives', `${name}.ts`), `export type ${name} = ${def.ts};\n`);
    writeFileSync(
      join(TYPES_DIR, 'zod', 'primitives', `${name}Schema.ts`),
      `import { z } from 'zod';\nexport const ${name}Schema = ${def.zod};\n`,
    );
  }

  // 2) collect enums from specs (property enums & top-level schema enums)
  const enumRegistry = collectEnumsFromSpecs(specs);

  // write enums
  for (const e of enumRegistry) {
    writeFileSync(
      join(TYPES_DIR, 'enums', `${e.name}.ts`),
      `export type ${e.name} = ${e.values.map((v) => `'${v}'`).join(' | ')};\n`,
    );
    writeFileSync(
      join(TYPES_DIR, 'zod', 'enums', `${e.name}Schema.ts`),
      `import { z } from 'zod';\nexport const ${e.name}Schema = z.enum([${e.values.map((v) => `'${v}'`).join(', ')}]);\n`,
    );
  }

  // 3) wrappers (ApiResponse<T> etc.) — consolidated
  writeFileSync(
    join(TYPES_DIR, 'wrappers', `ApiResponse.ts`),
    `
import type { DateTime } from '../primitives/DateTime';

export interface ApiMeta {
  pagination?: PaginationMeta;
  sorting?: SortingMeta;
  filtering?: FilteringMeta;
  total?: number;
  requestId?: string;
}
export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
export interface SortingMeta { sortBy: string; direction: string; }
export interface FilteringMeta { appliedFilters: Record<string, unknown>; }
export interface ApiError { code: string; message: string; field?: string; details?: string; }
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  meta?: ApiMeta;
  timestamp: DateTime;
}
export type ApiResponseString = ApiResponse<string>;
`,
  );

  writeFileSync(
    join(TYPES_DIR, 'zod', 'wrappers', `ApiResponseSchema.ts`),
    `
import { z } from 'zod';
import { DateTimeSchema } from '../primitives/DateTimeSchema';

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
  details: z.string().optional(),
}).strict();

export const PaginationMetaSchema = z.object({
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  isFirst: z.boolean(),
  isLast: z.boolean(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
}).strict();

export const SortingMetaSchema = z.object({
  sortBy: z.string(),
  direction: z.string(),
}).strict();

export const FilteringMetaSchema = z.object({
  appliedFilters: z.record(z.unknown()),
}).strict();

export const ApiMetaSchema = z.object({
  pagination: PaginationMetaSchema.optional(),
  sorting: SortingMetaSchema.optional(),
  filtering: FilteringMetaSchema.optional(),
  total: z.number().optional(),
  requestId: z.string().optional(),
}).strict();

export const ApiResponseSchemaOf = <T extends z.ZodTypeAny>(T: T) => z.object({
  success: z.boolean(),
  message: z.string(),
  data: T.optional(),
  errors: z.array(ApiErrorSchema).optional(),
  meta: ApiMetaSchema.optional(),
  timestamp: DateTimeSchema,
}).strict();
`,
  );

  // 4) models — start from generated TS files, normalize & move; also emit Zod from schemas
  const genModels: Array<{ api: ApiName; file: string; name: string; src: string; normHash: string }> = [];
  for (const [api, root] of [
    ['identity', gens.identityOut],
    ['booking', gens.bookingOut],
  ] as Array<[ApiName, string]>) {
    for (const sub of ['models', 'schemas']) {
      const d = join(root, sub);
      if (!existsSync(d)) continue;
      for (const file of listFiles(d, '.ts')) {
        const name = basename(file).replace(/\.ts$/, '');
        const src = readFileSync(file, 'utf-8');
        if (/class\s+ApiError\b/.test(src)) continue; // skip runtime class
        const normHash = sha(normalizeText(src));
        genModels.push({ api, file, name, src, normHash });
      }
    }
  }

  // merge identical by content
  const byName = new Map<string, Array<(typeof genModels)[number]>>();
  genModels.forEach((m) => {
    const arr = byName.get(m.name) ?? [];
    arr.push(m);
    byName.set(m.name, arr);
  });

  const writtenNames = new Set<string>();
  const identicalHashes = new Map<string, string>(); // hash -> chosenName

  for (const [name, files] of byName.entries()) {
    let chosenName = name;
    if (files.length === 1) {
      // single
      writeModel(name, files[0]);
      continue;
    }
    // multiple with same name — check identical
    const same = files.every((f) => f.normHash === files[0].normHash);
    if (same) {
      writeModel(name, files[0]);
      MIGRATION.merged.push(name);
      identicalHashes.set(files[0].normHash, name);
    } else {
      // collision: write namespaced versions
      for (const f of files) {
        const ns = `${f.api === 'identity' ? 'Identity' : 'Booking'}_${name}`;
        writeModel(ns, f);
        MIGRATION.renamed.push({ from: name, to: ns, reason: 'collision' });
      }
    }
  }

  // write barrel
  const barrel = buildTypesBarrel();
  writeFileSync(join(TYPES_DIR, 'index.ts'), barrel);

  // also stash raw generator outputs for diff/debug
  copyDirSafe(gens.identityOut, join(TYPES_DIR, '(generated)', 'identity'));
  copyDirSafe(gens.bookingOut, join(TYPES_DIR, '(generated)', 'booking'));

  /* inner: write model + zod */
  function writeModel(outName: string, m: { api: ApiName; file: string; src: string; name: string }) {
    // Replace namespace enums like "export namespace X { export enum y { ... } }"

    let code = m.src;

    // 1) Collect & emit namespace enums without touching `code` yet
    const nsBlocks = Array.from(code.matchAll(/export\s+namespace\s+(\w+)\s*\{([\s\S]*?)\}\s*/g));
    for (const [, _nsName, inner] of nsBlocks) {
      const enumMatch = inner.match(/export\s+enum\s+(\w+)\s*\{([\s\S]*?)\}/);
      if (!enumMatch) continue;
      const ename = enumMatch[1];
      const body = enumMatch[2];
      const values = Array.from(body.matchAll(/['"]([^'"]+)['"]/g)).map((x) => x[1]);
      const enumName = guessEnumNameFromNamespace(m.name, ename);

      // emit enum file once (idempotent)
      ensureEnum(enumName, values);
    }

    // 2) Remove entire namespace blocks
    code = code.replace(/export\s+namespace\s+\w+\s*\{[\s\S]*?\}\s*/g, '');

    // 3) After removal, rewrite references to the lifted enums
    //    - ": Role"      -> ": CompanyRole"
    //    - "Array<Role>" -> "CompanyRole[]"
    const liftedEnumRefs = findLiftedEnumRefs(code);
    for (const { original, lifted } of liftedEnumRefs) {
      const typeRef = new RegExp(`(:\\s*)${escapeReg(original)}(\\b)`, 'g');
      code = code.replace(typeRef, `$1${lifted}$2`);
      const arrayRef = new RegExp(`Array<\\s*${escapeReg(original)}\\s*>`, 'g');
      code = code.replace(arrayRef, `${lifted}[]`);
    }

    // helper to write enum + zod once
    function ensureEnum(enumName: string, values: string[]) {
      const enumPath = join(TYPES_DIR, 'enums', `${enumName}.ts`);
      if (!existsSync(enumPath)) {
        writeFileSync(enumPath, `export type ${enumName} = ${values.map((v) => `'${v}'`).join(' | ')};\n`);
        writeFileSync(
          join(TYPES_DIR, 'zod', 'enums', `${enumName}Schema.ts`),
          `import { z } from 'zod';\nexport const ${enumName}Schema = z.enum([${values.map((v) => `'${v}'`).join(', ')}]);\n`,
        );
      }
    }

    // scan for likely enum identifiers we just lifted (based on common patterns)
    function findLiftedEnumRefs(src: string) {
      const candidates: Array<{ original: string; lifted: string }> = [];
      // CompanyRoleAssignmentDto.role -> CompanyRole
      if (/CompanyRoleAssignmentDto\b/.test(m.name) && /\brole\b/.test(src)) {
        candidates.push({ original: 'role', lifted: 'CompanyRole' });
      }
      return candidates;
    }
    // Inline union arrays -> named enums if we know them from specs
    // example: Array<'SYSTEM_ADMIN' | 'USER'> => UserRole[]
    for (const e of enumRegistry) {
      const unionRx = new RegExp(
        `Array<\\s*(?:${e.values.map((v) => `'${escapeReg(v)}'`).join('\\s*\\|\\s*')})\\s*>`,
        'g',
      );
      code = code.replace(unionRx, `${e.name}[]`);
      const singleRx = new RegExp(
        `:\\s*(?:${e.values.map((v) => `'${escapeReg(v)}'`).join('\\s*\\|\\s*')})\\s*([;\\]\\n,}])`,
        'g',
      );
      code = code.replace(singleRx, `: ${e.name}$1`);
    }

    // Primitive aliasing (best-effort textual)
    code = code.replace(/:\s*string\s*;\s*\/\/\s*format:\s*email/g, ': Email; // format: email');
    code = code.replace(/:\s*string\s*;\s*\/\/\s*format:\s*date-time/g, ': DateTime; // format: date-time');
    // int64 common: sometimes generator emits number for int64—leave as-is unless unsafe
    // (You can further normalize if needed)

    // Strip generator headers
    code = code.replace(/\/\*[\s\S]*?do not edit[\s\S]*?\*\//gi, '');

    writeFileSync(join(TYPES_DIR, 'models', `${outName}.ts`), code);

    // Emit Zod from the OpenAPI schema (if we can find it)
    const schema = findSchemaForModel(specs, m.name);
    if (schema) {
      const zod = zodFromSchema(schema, outName);
      writeFileSync(join(TYPES_DIR, 'zod', 'models', `${outName}Schema.ts`), zod);
    } else {
      // fallback placeholder for unknowns
      writeFileSync(
        join(TYPES_DIR, 'zod', 'models', `${outName}Schema.ts`),
        `import { z } from 'zod';\nexport const ${outName}Schema = z.any();\n`,
      );
    }
  }
}

/* ----------------------- Enum collection from specs --------------------- */

function collectEnumsFromSpecs(specs: SpecPack) {
  type E = { name: string; values: string[]; source: string };
  const out: E[] = [];
  const add = (name: string, values: string[], source: string) => {
    // dedupe by set equality
    const key = `${name}::${values.slice().sort().join('|')}`;
    if (out.some((e) => e.name === name && arrEq(e.values, values))) return;
    out.push({ name, values, source });
  };

  for (const [apiName, spec] of [
    ['identity', specs.identitySpec],
    ['booking', specs.bookingSpec],
  ] as Array<[ApiName, OAS]>) {
    const schemas = spec?.components?.schemas || {};
    for (const [schemaName, schema] of Object.entries<any>(schemas)) {
      // if top-level is enum
      if (Array.isArray(schema.enum) && schema.type === 'string') {
        add(enumNameFromTop(schemaName, apiName), schema.enum, `${apiName}.${schemaName}`);
      }
      // properties
      const props = schema?.properties || {};
      for (const [propName, prop] of Object.entries<any>(props)) {
        const inner = prop?.items ?? prop;
        if (Array.isArray(inner?.enum) && inner.type === 'string') {
          const name = enumNameFromProp(schemaName, propName, apiName);
          add(name, inner.enum, `${apiName}.${schemaName}.${propName}`);
        }
      }
    }
  }

  // collapse identical names with identical sets; if identical sets but different names, keep both (least surprise)
  return out;
}

function enumNameFromProp(parent: string, prop: string, api: ApiName) {
  // special-cases for your specs
  if (/^userRoles?$/i.test(prop)) return 'UserRole';
  if (/^role$/i.test(prop) && /CompanyRoleAssignmentDto$/.test(parent)) return 'CompanyRole';
  // generic fallback
  return pascal(prop);
}
function enumNameFromTop(name: string, api: ApiName) {
  return pascal(name);
}
function guessEnumNameFromNamespace(parentModel: string, enumKey: string) {
  if (/^role$/i.test(enumKey) && /CompanyRoleAssignmentDto$/.test(parentModel)) return 'CompanyRole';
  return pascal(enumKey);
}
const arrEq = (a: string[], b: string[]) => {
  const as = a.slice().sort().join('|');
  const bs = b.slice().sort().join('|');
  return as === bs;
};
const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------ Zod generator from schema --------------------- */

function zodFromSchema(schema: any, name: string): string {
  const header = `import { z } from 'zod';\n`;
  const body = `export const ${name}Schema = ${zExpr(schema)};\n`;
  return header + body;

  function zExpr(s: any): string {
    if (!s) return 'z.any()';
    if (s.$ref) {
      const ref = s.$ref.split('/').pop()!;
      return `${pascal(ref)}Schema`;
    }
    if (s.oneOf) return `z.union([${s.oneOf.map(zExpr).join(', ')}])`;
    if (s.anyOf) return `z.union([${s.anyOf.map(zExpr).join(', ')}])`;
    if (s.allOf) return s.allOf.map(zExpr).reduce((a: any, b: any) => `z.intersection(${a}, ${b})`);

    switch (s.type) {
      case 'string':
        if (Array.isArray(s.enum)) return `z.enum([${s.enum.map((v: string) => `'${v}'`).join(', ')}])`;
        if (s.format === 'email') return 'z.string().email()';
        if (s.format === 'date-time') return 'z.string().datetime()';
        return 'z.string()';
      case 'integer':
      case 'number':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'array':
        return `z.array(${zExpr(s.items)})`;
      case 'object': {
        const props = s.properties || {};
        const req = new Set<string>(s.required || []);
        const entries = Object.entries<any>(props).map(([k, v]) => {
          const base = `${JSON.stringify(k)}: ${zExpr(v)}`;
          return req.has(k) ? base : `${base}.optional()`;
        });
        const obj = `z.object({ ${entries.join(', ')} })`;
        return s.additionalProperties ? `${obj}.catchall(${zExpr(s.additionalProperties)})` : `${obj}.strict()`;
      }
      default:
        return 'z.any()';
    }
  }
}

function findSchemaForModel(specs: SpecPack, modelName: string) {
  for (const spec of [specs.identitySpec, specs.bookingSpec]) {
    const found = spec?.components?.schemas?.[modelName];
    if (found) return found;
  }
  return null;
}

/* ----------------------- Extract services & rewrite --------------------- */

function extractServicesAndRewrite(api: ApiName, genRoot: string, outRoot: string) {
  cleanDir(outRoot);
  const srcServices = join(genRoot, 'services');
  const dstServices = join(outRoot, 'services');
  mkdirSync(dstServices, { recursive: true });

  // copy services only
  for (const file of listFiles(srcServices, '.ts')) {
    const rel = relative(srcServices, file);
    const out = join(dstServices, rel);
    mkdirSync(dirname(out), { recursive: true });
    let code = readFileSync(file, 'utf-8');

    // strip "generator cruft" headers
    code = code.replace(/\/\*[\s\S]*?do not edit[\s\S]*?\*\//gi, '');

    // rewrite imports:
    // models/schemas -> @types
    code = code.replace(/from\s+['"]\.\.\/models\/[^'"]+['"]/g, `from '@types'`);
    code = code.replace(/from\s+['"]\.\.\/schemas\/[^'"]+['"]/g, `from '@types'`);
    // core -> @http
    code = code.replace(/from\s+['"]\.\.\/core\/[^'"]+['"]/g, `from '@http'`);

    // optional: enforce named imports only (keep as-is — generator usually uses named)

    writeFileSync(out, code);
  }
}

/* ------------------------- Combined client writer ----------------------- */

function writeCombinedClient(api: ApiName, apiRoot: string) {
  const files = listFiles(join(apiRoot, 'services'), '.ts');
  const serviceNames = files.map((f) => basename(f).replace(/\.ts$/, '')).filter((n) => !n.endsWith('index'));
  const lines: string[] = [];
  for (const n of serviceNames) lines.push(`export * as ${n} from './services/${n}';`);

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
  writeFileSync(join(apiRoot, 'index.ts'), lines.join('\n') + '\nexport * from "./client";\n');
}

/* ------------------------------- utils ---------------------------------- */

function copyDirSafe(src: string, dst: string) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dst, entry);
    const st = statSync(s);
    if (st.isDirectory()) copyDirSafe(s, d);
    else if (st.isFile()) writeFileSync(d, readFileSync(s));
  }
}

function buildTypesBarrel(): string {
  const sections = [
    { dir: 'primitives', rel: './primitives' },
    { dir: 'enums', rel: './enums' },
    { dir: 'models', rel: './models' },
    { dir: 'wrappers', rel: './wrappers' },
    { dir: join('zod', 'primitives'), rel: './zod/primitives' },
    { dir: join('zod', 'enums'), rel: './zod/enums' },
    { dir: join('zod', 'models'), rel: './zod/models' },
    { dir: join('zod', 'wrappers'), rel: './zod/wrappers' },
  ];

  const lines: string[] = [];

  for (const s of sections) {
    const abs = join(TYPES_DIR, s.dir);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const name = entry.name.replace(/\.ts$/, '');
      lines.push(`export * from '${s.rel}/${name}';`);
    }
  }

  // nice to have: a single default export object if you ever want it — omitted for now
  return lines.sort().join('\n') + '\n';
}
