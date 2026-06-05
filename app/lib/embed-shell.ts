import type { CSSProperties } from 'react';

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
