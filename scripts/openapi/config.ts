import { join } from 'node:path';

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing required env: ${key}`);
  return value;
};

export const ID_DOCS = getEnv('VITE_API_IDENTITY_DOCS_URL');
export const BK_DOCS = getEnv('VITE_API_BOOKING_DOCS_URL');

export const ROOT = process.cwd();
export const TMP_DIR = join(ROOT, 'tmp', 'openapi');
export const GEN_DIR = join(TMP_DIR, 'gen');
export const OUT_ROOT = join(ROOT, 'app', 'api');
export const CLIENTS_DIR = join(OUT_ROOT, 'clients');
export const TYPES_DIR = join(CLIENTS_DIR, 'types');
export const HTTP_DIR = join(CLIENTS_DIR, 'http');

export const ID_OUT = join(GEN_DIR, 'identity');
export const BK_OUT = join(GEN_DIR, 'booking');

export const ID_CLIENT = join(CLIENTS_DIR, 'identity');
export const BK_CLIENT = join(CLIENTS_DIR, 'booking');
