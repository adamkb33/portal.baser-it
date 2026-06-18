import type { CSSProperties } from 'react';

export const fredrikstadBarbershopTheme = {
  '--color-background': '#101010',
  '--color-surface': '#1d1d1d',
  '--color-surface-raised': '#262626',
  '--color-border': '#343434',
  '--color-border-strong': '#d19f68',

  '--color-text-primary': '#f8f8f8',
  '--color-text-secondary': '#c7c0b7',
  '--color-text-disabled': '#837b72',
  '--color-text-inverse': '#101010',

  '--color-primary': '#d19f68',
  '--color-primary-hover': '#af804d',
  '--color-primary-active': '#8c6338',
  '--color-primary-contrast': '#101010',

  '--color-interactive': '#d19f68',
  '--color-interactive-hover': '#af804d',
  '--color-interactive-active': '#8c6338',

  '--color-secondary': '#b8892f',

  // Route-level booking background
  '--color-booking-background': 'transparent',

  // Main booking cards/panels
  '--color-booking-surface': '#181818',

  // Grouped/quiet sections
  '--color-booking-surface-muted': '#222222',

  // Inputs/cards that need to sit above normal panels
  '--color-booking-surface-raised': '#2a2a2a',

  // Soft rows and low-emphasis cards
  '--color-booking-surface-subtle': '#202020',

  // Selected non-primary surfaces
  '--color-booking-surface-strong': '#332716',

  '--color-booking-border': '#383838',
  '--color-booking-border-strong': '#d19f68',

  '--color-booking-text': '#f8f8f8',
  '--color-booking-text-muted': '#c7c0b7',
  '--color-booking-text-inverse': '#101010',

  '--color-booking-action': '#d19f68',
  '--color-booking-action-hover': '#af804d',
  '--color-booking-action-muted': 'rgb(209 159 104 / 0.16)',
  '--color-booking-action-ring': 'rgb(209 159 104 / 0.42)',
  '--color-booking-action-contrast': '#101010',

  '--color-booking-accent': '#b8892f',
  '--color-booking-accent-muted': 'rgb(184 137 47 / 0.18)',

  '--radius-control': '0px',
  '--radius-field': '0px',
  '--radius-card': '7px',
  '--radius-panel': '0px',
  '--radius-badge': '9999px',
  '--radius-booking-control': '0px',
  '--radius-booking-field': '0px',
  '--radius-booking-card': '7px',
  '--radius-booking-panel': '0px',
  '--radius-booking-badge': '9999px',

  '--border-control': '1px',
  '--border-card': '1px',
  '--border-selected': '3px',
  '--border-focus-ring': '3px',
  '--border-booking-control': '1px',
  '--border-booking-card': '1px',
  '--border-booking-selected': '3px',
  '--border-booking-focus-ring': '3px',

  '--shadow-card': '0 12px 34px rgb(0 0 0 / 0.28)',
  '--shadow-panel': '0 20px 56px rgb(0 0 0 / 0.34)',
  '--shadow-floating': '0 22px 70px rgb(0 0 0 / 0.42)',
  '--shadow-booking-card': '0 12px 34px rgb(0 0 0 / 0.28)',
  '--shadow-booking-panel': '0 20px 56px rgb(0 0 0 / 0.34)',
  '--shadow-booking-floating': '0 22px 70px rgb(0 0 0 / 0.42)',
} as CSSProperties;
