import { createCookie } from 'react-router';
import type { EmbedThemeKey } from './embed-shell';
import { isEmbedThemeKey } from './embed-shell';

type EmbedConfig = {
  theme: EmbedThemeKey;
  parentOrigin: string | null;
};

const DEFAULT_EMBED_THEME: EmbedThemeKey = 'pitell';
const DEFAULT_EMBED_CONFIG: EmbedConfig = {
  theme: DEFAULT_EMBED_THEME,
  parentOrigin: null,
};

const embedConfigCookie = createCookie('embed_config', {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/embed',
  maxAge: 60 * 60 * 4,
});

export async function parseEmbedConfig(request: Request): Promise<EmbedConfig> {
  const value = await embedConfigCookie.parse(request.headers.get('Cookie'));

  if (!value || typeof value !== 'object') {
    return DEFAULT_EMBED_CONFIG;
  }

  const themeCandidate = (value as Record<string, unknown>).theme;
  const parentOriginCandidate = (value as Record<string, unknown>).parentOrigin;
  const parentOrigin = typeof parentOriginCandidate === 'string' ? resolveEmbedParentOrigin(parentOriginCandidate) : null;

  if (typeof themeCandidate === 'string' && isEmbedThemeKey(themeCandidate)) {
    return { theme: themeCandidate, parentOrigin };
  }

  return DEFAULT_EMBED_CONFIG;
}

export async function serializeEmbedConfig(config: EmbedConfig): Promise<string> {
  return embedConfigCookie.serialize(config);
}

export function resolveEmbedTheme(value: string | null): EmbedThemeKey | null {
  if (!value) {
    return DEFAULT_EMBED_THEME;
  }

  return isEmbedThemeKey(value) ? value : null;
}

export function resolveEmbedParentOrigin(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
