import { createTheme } from '../createTheme';
import { withDataviz } from '../dataviz/withDataviz';

const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          50: '#EEF1F8',
          100: '#CDD5EA',
          200: '#9BAED5',
          300: '#6887BF',
          400: '#3A61A8',
          500: '#1A3D8F',
          600: '#142E6E',
          700: '#0E2050',
          800: '#081333',
          900: '#03091A',
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

export const ventures = withDataviz(bundle);
