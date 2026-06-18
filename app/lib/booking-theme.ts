import type { CSSProperties } from 'react';

import { fredrikstadBarbershopTheme } from './booking-themes/fredrikstad-barbershop';

export const BOOKING_THEME_KEYS = ['pitell', 'ocean', 'sunset', 'forest', 'fredrikstad-barbershop'] as const;
export type BookingThemeKey = (typeof BOOKING_THEME_KEYS)[number];

export const BOOKING_THEME_LABELS: Record<BookingThemeKey, string> = {
  pitell: 'Pitell',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
  'fredrikstad-barbershop': 'Fredrikstad Barbershop',
};

export const BOOKING_THEME_TOKENS: Record<BookingThemeKey, CSSProperties> = {
  pitell: {},
  ocean: {
    '--color-background': '#f3fbff',
    '--color-surface': '#e8f6ff',
    '--color-border': '#c7e8ff',
    '--color-text-primary': '#0b2f4a',
    '--color-text-secondary': '#2f5f84',
    '--color-interactive': '#0b5cab',
    '--color-interactive-hover': '#094f93',
    '--radius-control': '10px',
    '--radius-field': '10px',
    '--radius-card': '18px',
    '--radius-panel': '24px',
    '--border-control': '1px',
    '--border-card': '1px',
    '--border-selected': '2px',
    '--shadow-card': '0 8px 28px rgb(11 92 171 / 0.08)',
    '--shadow-panel': '0 14px 44px rgb(11 92 171 / 0.12)',
  } as CSSProperties,
  sunset: {
    '--color-background': '#fff6f2',
    '--color-surface': '#ffede4',
    '--color-border': '#ffd6c4',
    '--color-text-primary': '#512318',
    '--color-text-secondary': '#8b4d3e',
    '--color-interactive': '#b53b1f',
    '--color-interactive-hover': '#9e331a',
    '--radius-control': '9999px',
    '--radius-field': '18px',
    '--radius-card': '22px',
    '--radius-panel': '28px',
    '--border-control': '1px',
    '--border-card': '1px',
    '--border-selected': '3px',
    '--shadow-card': '0 10px 30px rgb(181 59 31 / 0.08)',
    '--shadow-panel': '0 18px 48px rgb(181 59 31 / 0.13)',
  } as CSSProperties,
  forest: {
    '--color-background': '#f2faf4',
    '--color-surface': '#e4f2e8',
    '--color-border': '#cbe2d1',
    '--color-text-primary': '#163222',
    '--color-text-secondary': '#3d6a53',
    '--color-interactive': '#1f6b45',
    '--color-interactive-hover': '#19593a',
    '--radius-control': '6px',
    '--radius-field': '6px',
    '--radius-card': '8px',
    '--radius-panel': '12px',
    '--border-control': '1px',
    '--border-card': '2px',
    '--border-selected': '3px',
    '--shadow-card': 'none',
    '--shadow-panel': '0 8px 22px rgb(31 107 69 / 0.10)',
  } as CSSProperties,
  'fredrikstad-barbershop': fredrikstadBarbershopTheme,
};

export function isBookingThemeKey(value: string | null): value is BookingThemeKey {
  if (!value) return false;
  return (BOOKING_THEME_KEYS as readonly string[]).includes(value);
}
