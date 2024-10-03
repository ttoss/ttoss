import type { Config } from 'tailwindcss';

const config: Config = {
  corePlugins: {
    preflight: false,
    container: false,
  },
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{jsx,tsx,html}'],
  theme: {
    extend: {
      spacing: {
        none: '0',
        xs: '0.25rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '4rem',
        '2xl': '8rem',
      },
    },
  },
  plugins: [],
};

export default config;
