import axios from 'axios';
import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import { ROOT } from './config';
import type { OAS } from './types';

export async function loadSpec(source: string): Promise<OAS> {
  if (/^https?:\/\//i.test(source)) {
    const response = await axios.get(source, { timeout: 30000 });
    return response.data;
  }
  if (source.startsWith('file://')) source = source.replace('file://', '');
  const filePath = isAbsolute(source) ? source : join(ROOT, source);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}
