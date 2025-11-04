import { join } from 'node:path';

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing required env: ${key}`);
  return value;
};

export const BASE_DOCS = getEnv('VITE_API_BASE_SERVICE_DOCS_URL');
export const BOOKING_DOCS = getEnv('VITE_API_BOOKING_SERVICE_DOCS_URL');

export const ROOT = process.cwd();
export const TMP_DIR = join(ROOT, 'tmp', 'openapi');
export const GEN_DIR = join(TMP_DIR, 'gen');
export const OUT_ROOT = join(ROOT, 'app', 'api');
export const CLIENTS_DIR = join(OUT_ROOT, 'clients');
export const TYPES_DIR = join(CLIENTS_DIR, 'types');
export const HTTP_DIR = join(CLIENTS_DIR, 'http');

export const ID_OUT = join(GEN_DIR, 'base');
export const BK_OUT = join(GEN_DIR, 'booking');

export const ID_CLIENT = join(CLIENTS_DIR, 'base');
export const BK_CLIENT = join(CLIENTS_DIR, 'booking');
