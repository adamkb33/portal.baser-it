import { createCipheriv, createDecipheriv, createHash } from 'crypto';

const DEFAULT_COMPANY_ID_KEY = 'dev-company-id-key';
const COMPANY_ID_KEY_SOURCE = process.env.COMPANY_ID_ENCRYPTION_KEY ?? DEFAULT_COMPANY_ID_KEY;
const COMPANY_ID_KEY = createHash('sha256').update(COMPANY_ID_KEY_SOURCE).digest().subarray(0, 16);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bytesToUuid(bytes: Buffer): string {
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function uuidToBytes(uuid: string): Buffer | null {
  if (!UUID_PATTERN.test(uuid)) return null;
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

export function encodeCompanyIdToken(companyId: number): string {
  if (!Number.isSafeInteger(companyId) || companyId < 0) {
    throw new Error('Invalid company id for encoding');
  }

  const payload = Buffer.alloc(16);
  payload.writeBigUInt64BE(BigInt(companyId), 8);

  const cipher = createCipheriv('aes-128-ecb', COMPANY_ID_KEY, null);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);

  return bytesToUuid(encrypted);
}

export function decodeCompanyIdToken(token: string): number | null {
  const bytes = uuidToBytes(token);
  if (!bytes) return null;

  const decipher = createDecipheriv('aes-128-ecb', COMPANY_ID_KEY, null);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(bytes), decipher.final()]);

  const value = decrypted.readBigUInt64BE(8);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) return null;

  return Number(value);
}
