/**
 * Bruttal2 Core Tokens
 *
 * Foundation tokens that store raw brand values with minimal abstraction.
 * Semantic tokens should derive from these core tokens.
 * These tokens follow the ttoss design token architecture as described in the design system documentation.
 * https://ttoss.dev/docs/design/design-system/design-tokens/core-tokens
 */

// ===== CORE COLORS =====

/**
 * Brand Colors
 * Define the brand's visual identity
 */
export const coreColors = {
  // Brand identity colors
  main: '#1a1a1a',
  complimentary: '#f8f8f8',
  accent: '#ff4444',
  darkNeutral: '#2d2d2d',
  lightNeutral: '#fafafa',

  // Gray scale
  black: '#000000',
  gray100: '#f9f9f9',
  gray200: '#e0e0e0',
  gray300: '#c7c7c7',
  gray400: '#adadad',
  gray500: '#949494',
  gray600: '#7a7a7a',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#2d2d2d',
  white: '#ffffff',

  // Hue colors
  red50: '#fff5f5',
  red100: '#ffebee',
  red200: '#ffcdd2',
  red300: '#ef9a9a',
  red400: '#e57373',
  red500: '#f44336',
  red600: '#e53935',
  red700: '#d32f2f',
  red800: '#c62828',
  red900: '#b71c1c',

  amber50: '#fff8e1',
  amber100: '#fff8e1',
  amber200: '#ffecb3',
  amber300: '#ffe082',
  amber400: '#ffd54f',
  amber500: '#ffca28',
  amber600: '#ff8f00',
  amber700: '#ff6f00',
  amber800: '#ffab00',
  amber900: '#ff6f00',

  teal50: '#e0f7fa',
  teal100: '#e0f2f1',
  teal200: '#b2dfdb',
  teal300: '#80cbc4',
  teal400: '#4db6ac',
  teal500: '#26a69a',
  teal600: '#00695c',
  teal700: '#004d40',
  teal800: '#00332c',
  teal900: '#001a14',
} as const;

// ===== CORE FONTS =====

/**
 * Typography Core Tokens
 * Font families following the brutalist aesthetic
 */
export const coreFonts = {
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
} as const;

// ===== CORE RADII =====

/**
 * Border Radius Core Tokens
 * Sharp, minimal radii for brutalist aesthetic
 */
export const coreRadii = Object.freeze({
  none: '0',
  '2xs': '0.0625rem',
  xs: '0.125rem', // 2px
  sm: '0.125rem', // 2px - minimal rounding
  md: '0.125rem', // 2px - consistent sharp look
  lg: '0.125rem', // 2px - no progressive rounding
  xl: '0.125rem', // 2px
  '2xl': '0.125rem', // 2px
  '3xl': '0.125rem', // 2px
  '4xl': '0.125rem', // 2px
  full: '9999px', // Only for circles
});

// ===== CORE SPACING =====
export const spacing = Object.freeze({
  px: '1px', // 1px
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
});

// ===== CORE SIZES =====
export const sizes = Object.freeze({
  max: 'max-content',
  min: 'min-content',
  full: '100%',
  '3xs': '14rem',
  '2xs': '16rem',
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  '8xl': '90rem',
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
});

// ===== CORE BORDERS =====
export const borders = Object.freeze({
  none: '0px solid',
  xs: '0.5px solid',
  sm: '1px solid',
  md: '2px solid',
  lg: '4px solid',
  xl: '8px solid',
});
