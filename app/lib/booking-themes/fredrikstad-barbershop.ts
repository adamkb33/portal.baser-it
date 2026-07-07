import type { CSSProperties } from 'react';

export const fredrikstadBarbershopTheme = {
  '--color-background': '#ffffff',
  '--color-surface': '#f8f8f8',
  '--color-surface-raised': '#ffffff',
  '--color-border': '#e6ded5',
  '--color-border-strong': '#d19f68',

  '--color-text-primary': '#212025',
  '--color-text-secondary': '#10285d',
  '--color-text-disabled': '#8b8278',
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
  '--color-booking-background': '#ffffff',

  // Main booking cards/panels
  '--color-booking-surface': '#ffffff',

  // Grouped/quiet sections
  '--color-booking-surface-muted': '#f8f8f8',

  // Inputs/cards that need to sit above normal panels
  '--color-booking-surface-raised': '#ffffff',

  // Soft rows and low-emphasis cards
  '--color-booking-surface-subtle': '#f3f0ec',

  // Selected non-primary surfaces
  '--color-booking-surface-strong': '#fff4e8',

  '--color-booking-border': '#e6ded5',
  '--color-booking-border-strong': '#d19f68',

  '--color-booking-text': '#212025',
  '--color-booking-text-muted': '#10285d',
  '--color-booking-text-inverse': '#101010',

  '--color-booking-action': '#d19f68',
  '--color-booking-action-hover': '#af804d',
  '--color-booking-action-muted': 'rgb(209 159 104 / 0.16)',
  '--color-booking-action-ring': 'rgb(209 159 104 / 0.42)',
  '--color-booking-action-contrast': '#101010',

  '--color-booking-accent': '#b8892f',
  '--color-booking-accent-muted': 'rgb(184 137 47 / 0.18)',
} as CSSProperties;
