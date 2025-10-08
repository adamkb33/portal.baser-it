import { generate } from "openapi-typescript-codegen";
import * as fs from "node:fs";
import * as path from "node:path";

function loadEnv(file = ".env.local") {
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const input = env.VITE_API_IDENTITY_DOCS_URL || "";
const outDir = path.resolve(env.VITE_API_IDENTITY_DOCS_OUT_DIR || "");

await generate({
  input,
  output: outDir,
  httpClient: "fetch",
  useOptions: true,
  exportServices: true,
  exportSchemas: true,
  clientName: "IdentityApiClient",
});

console.log(`✅ Identity client generated from ${input} → ${outDir}`);
