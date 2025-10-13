import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function writeJson(dir: string, name: string, data: unknown) {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(data, null, 2));
  return p;
}

export function cleanDir(dir: string) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

export function listFiles(root: string, ext = '.ts') {
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

export function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

export function copyDirSafe(src: string, dst: string) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dst, entry);
    const st = statSync(s);
    if (st.isDirectory()) copyDirSafe(s, d);
    else if (st.isFile()) {
      mkdirSync(dirname(d), { recursive: true });
      writeFileSync(d, readFileSync(s));
    }
  }
}
