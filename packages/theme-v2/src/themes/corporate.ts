import { createTheme } from '../createTheme';
import { withDataviz } from '../dataviz/withDataviz';

const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          50: '#E3F2FF',
          100: '#B3DAFF',
          200: '#80BFFF',
          300: '#4DA5FF',
          400: '#1A8AFF',
          500: '#0469E3',
          600: '#0352A6',
          700: '#022D66',
          800: '#011923',
          900: '#000000',
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

export const corporate = withDataviz(bundle);
