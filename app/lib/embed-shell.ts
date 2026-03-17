import type { CSSProperties } from 'react';

export const EMBED_MODE_COOKIE = 'embed_mode';
export const EMBED_THEME_COOKIE = 'embed_theme';

export const EMBED_THEME_KEYS = ['pitell', 'ocean', 'sunset', 'forest'] as const;
export type EmbedThemeKey = (typeof EMBED_THEME_KEYS)[number];

export const EMBED_THEME_LABELS: Record<EmbedThemeKey, string> = {
  pitell: 'Pitell',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
};

export const EMBED_THEME_TOKENS: Record<EmbedThemeKey, CSSProperties> = {
  pitell: {},
  ocean: {
    '--color-background': '#f3fbff',
    '--color-surface': '#e8f6ff',
    '--color-border': '#c7e8ff',
    '--color-text-primary': '#0b2f4a',
    '--color-text-secondary': '#2f5f84',
    '--color-interactive': '#0b5cab',
    '--color-interactive-hover': '#094f93',
  } as CSSProperties,
  sunset: {
    '--color-background': '#fff6f2',
    '--color-surface': '#ffede4',
    '--color-border': '#ffd6c4',
    '--color-text-primary': '#512318',
    '--color-text-secondary': '#8b4d3e',
    '--color-interactive': '#b53b1f',
    '--color-interactive-hover': '#9e331a',
  } as CSSProperties,
  forest: {
    '--color-background': '#f2faf4',
    '--color-surface': '#e4f2e8',
    '--color-border': '#cbe2d1',
    '--color-text-primary': '#163222',
    '--color-text-secondary': '#3d6a53',
    '--color-interactive': '#1f6b45',
    '--color-interactive-hover': '#19593a',
  } as CSSProperties,
};

export function isEmbedThemeKey(value: string | null): value is EmbedThemeKey {
  if (!value) return false;
  return (EMBED_THEME_KEYS as readonly string[]).includes(value);
}

function parseCookieMap(cookieString: string): Record<string, string> {
  return cookieString
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return acc;
      const key = part.slice(0, separator);
      const rawValue = part.slice(separator + 1);
      acc[key] = decodeURIComponent(rawValue);
      return acc;
    }, {});
}

export function readEmbedModeFromCookieString(cookieString: string): boolean {
  const cookies = parseCookieMap(cookieString);
  return cookies[EMBED_MODE_COOKIE] === '1';
}

export function readEmbedThemeFromCookieString(cookieString: string): EmbedThemeKey {
  const cookies = parseCookieMap(cookieString);
  const value = cookies[EMBED_THEME_COOKIE];
  return isEmbedThemeKey(value) ? value : 'pitell';
}

function isSecureCookieRequest(requestUrl: string): boolean {
  const url = new URL(requestUrl);
  return url.protocol === 'https:';
}

function buildSetCookieHeader(requestUrl: string, name: string, value: string): string {
  const secure = isSecureCookieRequest(requestUrl);
  const sameSite = secure ? 'None' : 'Lax';
  const base = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=14400; SameSite=${sameSite}`;
  return secure ? `${base}; Secure` : base;
}

export function buildEmbedModeCookieHeader(requestUrl: string): string {
  return buildSetCookieHeader(requestUrl, EMBED_MODE_COOKIE, '1');
}

export function buildEmbedThemeCookieHeader(requestUrl: string, theme: EmbedThemeKey): string {
  return buildSetCookieHeader(requestUrl, EMBED_THEME_COOKIE, theme);
}
