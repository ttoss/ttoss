import { createTheme } from '../createTheme';
import { withDataviz } from '../dataviz/withDataviz';

const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          50: '#FBF8F5',
          100: '#F3EDE6',
          200: '#E4D7CC',
          300: '#CCBCAE',
          400: '#B09E90',
          500: '#8C7A6A',
          600: '#6D5D4F',
          700: '#4E4239',
          800: '#312921',
          900: '#1A150E',
        },
      },
    },
    semantic: {
      /* to do */
    },
  },
  alternate: {
    semantic: {
      /* to do */
    },
  },
});

export const bruttal = withDataviz(bundle);
