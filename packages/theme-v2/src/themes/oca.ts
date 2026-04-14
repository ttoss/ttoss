import { createTheme } from '../createTheme';
import { withDataviz } from '../dataviz/withDataviz';

const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          50: '#F5FBEA',
          100: '#E4F6C2',
          200: '#CAED8A',
          300: '#ABDF4E',
          400: '#8ECE1F',
          500: '#6DB800',
          600: '#549100',
          700: '#3C6A00',
          800: '#254300',
          900: '#111F00',
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

export const oca = withDataviz(bundle);
