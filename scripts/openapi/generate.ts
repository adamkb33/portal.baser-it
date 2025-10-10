import "dotenv/config";
import { generate } from "openapi-typescript-codegen";
import { fetch } from "undici";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  unlinkSync,
  renameSync,
} from "node:fs";
import { join, dirname, relative, sep, isAbsolute, resolve } from "node:path";

type OAS = any;

type SharedSummary = {
  core: string[];
  models: string[];
  schemas: string[];
};

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required env: ${key}`);
  }
  return value;
};

const ID_DOCS = getEnv("VITE_API_IDENTITY_DOCS_URL");
const BK_DOCS = getEnv("VITE_API_BOOKING_DOCS_URL");

const ROOT = process.cwd();
const TMP_DIR = join(ROOT, "tmp", "openapi");
const OUTPUT_DIR = join(ROOT, "app", "api", "clients");

console.log("⬇️  fetching OpenAPI specs…");
const [identitySpec, bookingSpec]: [OAS, OAS] = await Promise.all([
  loadSpec(ID_DOCS),
  loadSpec(BK_DOCS),
]);

prepareDir(TMP_DIR);
prepareDir(OUTPUT_DIR);

const identitySpecPath = writeSpec(TMP_DIR, "identity.openapi.json", identitySpec);
const bookingSpecPath = writeSpec(TMP_DIR, "booking.openapi.json", bookingSpec);

const identityOut = join(OUTPUT_DIR, "identity");
const bookingOut = join(OUTPUT_DIR, "booking");

console.log("🛠️  generating TypeScript clients…");
await Promise.all([
  generate({
    input: identitySpecPath,
    output: identityOut,
    httpClient: "fetch",
    useOptions: true,
    exportServices: true,
    exportSchemas: true,
  }),
  generate({
    input: bookingSpecPath,
    output: bookingOut,
    httpClient: "fetch",
    useOptions: true,
    exportServices: true,
    exportSchemas: true,
  }),
]);

const commonOut = join(OUTPUT_DIR, "common");
mkdirSync(commonOut, { recursive: true });

const shared = collectShared(identityOut, bookingOut);
const sharedMapping = moveSharedFiles(identityOut, bookingOut, commonOut, shared);

const identityCoreMapping = relocateRemainingCore(identityOut);
const bookingCoreMapping = relocateRemainingCore(bookingOut);
const relocationMap = new Map<string, string>([
  ...sharedMapping,
  ...identityCoreMapping,
  ...bookingCoreMapping,
]);

rewriteImports(identityOut, relocationMap);
rewriteImports(bookingOut, relocationMap);

inlineOpenApiConfig(commonOut);
dedupeApiErrorExport(identityOut);
dedupeApiErrorExport(bookingOut);

console.log("✅ generated clients → app/api/clients");
console.log(
  `   • common/${summaryList(shared.core.length, shared.models.length, shared.schemas.length)}\n` +
    `   • identity (unique + re-exports)\n` +
    `   • booking (unique + re-exports)`
);

function writeSpec(base: string, name: string, spec: OAS) {
  const specPath = join(base, name);
  writeFileSync(specPath, JSON.stringify(spec, null, 2));
  return specPath;
}

async function loadSpec(source: string): Promise<OAS> {
  if (/^https?:\/\//i.test(source)) {
    return fetch(source).then((r) => r.json());
  }

  if (source.startsWith("file://")) {
    source = source.replace("file://", "");
  }

  const filePath = isAbsolute(source) ? source : join(ROOT, source);
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function prepareDir(dir: string) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

function collectShared(identityRoot: string, bookingRoot: string): SharedSummary {
  return {
    core: findSharedFiles(identityRoot, bookingRoot, "core"),
    models: findSharedFiles(identityRoot, bookingRoot, "models"),
    schemas: findSharedFiles(identityRoot, bookingRoot, "schemas"),
  };
}

function findSharedFiles(
  identityRoot: string,
  bookingRoot: string,
  subDir: string
): string[] {
  const identityDir = join(identityRoot, subDir);
  const bookingDir = join(bookingRoot, subDir);

  if (!existsSync(identityDir) || !existsSync(bookingDir)) {
    return [];
  }

  const shared: string[] = [];
  for (const entry of readdirSync(identityDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const identityFile = join(identityDir, entry.name);
    const bookingFile = join(bookingDir, entry.name);
    if (!existsSync(bookingFile)) continue;

    const identitySource = readFileSync(identityFile, "utf-8");
    const bookingSource = readFileSync(bookingFile, "utf-8");

    if (identitySource === bookingSource) {
      shared.push(entry.name);
    }
  }
  return shared.sort();
}

function summaryList(coreCount: number, modelCount: number, schemaCount: number) {
  const parts: string[] = [];
  if (coreCount) parts.push(`${coreCount} core`);
  if (modelCount) parts.push(`${modelCount} models`);
  if (schemaCount) parts.push(`${schemaCount} schemas`);
  return parts.join(", ") || "no shared artifacts";
}

function moveSharedFiles(
  identityRoot: string,
  bookingRoot: string,
  commonRoot: string,
  shared: SharedSummary
) {
  type Entry = keyof SharedSummary;
  const sections: Entry[] = ["core", "models", "schemas"];
  const mapping = new Map<string, string>();

  for (const section of sections) {
    const items = shared[section];
    if (!items.length) continue;

    const commonSectionDir = join(commonRoot, section);
    mkdirSync(commonSectionDir, { recursive: true });

    for (const fileName of items) {
      const identityFile = resolve(identityRoot, section, fileName);
      const bookingFile = resolve(bookingRoot, section, fileName);
      const commonFile = resolve(commonSectionDir, fileName);

      const source = readFileSync(identityFile, "utf-8");
      writeFileSync(commonFile, source);

      if (existsSync(identityFile)) {
        unlinkSync(identityFile);
      }
      if (existsSync(bookingFile)) {
        unlinkSync(bookingFile);
      }

      mapping.set(identityFile, commonFile);
      mapping.set(bookingFile, commonFile);

      if (section === "core") {
        const identityRootFile = resolve(identityRoot, fileName);
        const bookingRootFile = resolve(bookingRoot, fileName);
        mapping.set(identityRootFile, commonFile);
        mapping.set(bookingRootFile, commonFile);
      }
    }
  }

  return mapping;
}

function relocateRemainingCore(serviceRoot: string) {
  const mapping = new Map<string, string>();
  const coreDir = join(serviceRoot, "core");
  if (!existsSync(coreDir)) {
    return mapping;
  }

  for (const entry of readdirSync(coreDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const source = resolve(coreDir, entry.name);
    const target = resolve(serviceRoot, entry.name);
    renameSync(source, target);
    mapping.set(source, target);
  }

  rmSync(coreDir, { recursive: true, force: true });
  return mapping;
}

function rewriteImports(rootDir: string, mapping: Map<string, string>) {
  if (!mapping.size) return;
  const files = collectTsFiles(rootDir);

  for (const file of files) {
    let content = readFileSync(file, "utf-8");
    let updated = content;

    const replaceSpecifier = (
      pattern: RegExp,
      replacer: (match: string, prefix: string, spec: string, suffix: string) => string
    ) => {
      updated = updated.replace(pattern, replacer);
    };

    const handler = (prefix: string, spec: string, suffix: string) => {
      const next = resolveMappedSpecifier(file, spec, mapping);
      if (!next || next === spec) {
        return `${prefix}${spec}${suffix}`;
      }
      return `${prefix}${next}${suffix}`;
    };

    replaceSpecifier(
      /(from\s+["'])([^"']+)(["'])/g,
      (match, prefix, spec, suffix) => handler(prefix, spec, suffix)
    );

    replaceSpecifier(
      /(import\(\s*["'])([^"']+)(["']\s*\))/g,
      (match, prefix, spec, suffix) => handler(prefix, spec, suffix)
    );

    if (updated !== content) {
      writeFileSync(file, updated);
    }
  }
}

function collectTsFiles(rootDir: string) {
  const out: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        out.push(fullPath);
      }
    }
  };

  walk(rootDir);
  return out;
}

function resolveMappedSpecifier(
  filePath: string,
  specifier: string,
  mapping: Map<string, string>
) {
  if (!specifier.startsWith(".")) {
    return null;
  }

  const baseDir = dirname(filePath);
  const absoluteCandidates = [
    resolve(baseDir, `${specifier}.ts`),
    resolve(baseDir, specifier, "index.ts"),
  ];

  for (const candidate of absoluteCandidates) {
    const normalized = normalizeFsPath(candidate);
    if (!mapping.has(normalized)) continue;
    const target = mapping.get(normalized)!;
    return toModuleSpecifier(filePath, target);
  }

  return null;
}

function toModuleSpecifier(fromFile: string, targetFile: string) {
  const relPath = normalizePath(
    relative(dirname(fromFile), targetFile).replace(/\.ts$/, "")
  );
  return relPath.startsWith(".") ? relPath : `./${relPath}`;
}

function normalizeFsPath(value: string) {
  return resolve(value);
}

function normalizePath(value: string) {
  return value.split(sep).join("/");
}

function inlineOpenApiConfig(commonDir: string) {
  const requestPath = join(commonDir, "core", "request.ts");
  if (!existsSync(requestPath)) {
    return;
  }

  let content = readFileSync(requestPath, "utf-8");
  const importLine = `import type { OpenAPIConfig } from './OpenAPI';\n`;
  if (!content.includes(importLine)) {
    return;
  }

  content = content.replace(importLine, "");

  const anchor = `import type { OnCancel } from './CancelablePromise';\n`;
  if (content.includes(anchor)) {
    const typeDef = `\nexport type OpenAPIConfig = {\n  BASE: string;\n  VERSION: string;\n  WITH_CREDENTIALS: boolean;\n  CREDENTIALS: 'include' | 'omit' | 'same-origin';\n  TOKEN?: string | ((options: ApiRequestOptions) => Promise<string>) | undefined;\n  USERNAME?: string | ((options: ApiRequestOptions) => Promise<string>) | undefined;\n  PASSWORD?: string | ((options: ApiRequestOptions) => Promise<string>) | undefined;\n  HEADERS?: Record<string, string> | ((options: ApiRequestOptions) => Promise<Record<string, string>>) | undefined;\n  ENCODE_PATH?: ((path: string) => string) | undefined;\n};\n`;
    content = content.replace(anchor, `${anchor}${typeDef}`);
  }

  writeFileSync(requestPath, content);
}

function dedupeApiErrorExport(serviceRoot: string) {
  const indexPath = join(serviceRoot, "index.ts");
  if (!existsSync(indexPath)) {
    return;
  }

  const content = readFileSync(indexPath, "utf-8");
  const updated = content.replace(
    /export \{\s*ApiError\s*\} from ['"][.]{1,2}\/[^'"]*core\/ApiError['"];?\n?/,
    ""
  );

  if (updated !== content) {
    writeFileSync(indexPath, updated);
  }
}
