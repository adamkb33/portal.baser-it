import crypto from 'node:crypto';

export const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
export const normalizeText = (s: string) => stripComments(s).replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
export const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const pascal = (s: string) =>
  s
    .replace(/[_\-\s]+/g, ' ')
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
    .replace(/[^\w]/g, '');

export const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
