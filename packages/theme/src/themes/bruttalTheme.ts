import { Theme } from 'theme-ui';

export const BruttalTheme: Theme = {
  colors: {
    text: '#0D0D0D',
    background: '#fff',
    backgroundBrand: '#C2C2C2',
    primary: '#0D0D0D',
    secondary: '#639',
    gray: '#555',
    muted: '#f6f6f6',
    danger: 'red',
    accent: '#0000FF',
    textOnSurface: '#FFFFFF',
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512, 1024],
  fonts: {
    body: '"Inconsolata", sans-serif',
    heading: '"Work Sans", sans-serif',
    monospace: '"Inconsolata", sans-serif',
  },
  fontSizes: {
    xxs: '0.5rem',
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },
  fontWeights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  styles: {
    root: {
      fontFamily: 'body',
      fontWeight: 'normal',
    },
    a: {
      color: 'primary',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontFamily: 'body',
    },
    progress: {
      color: 'primary',
      backgroundColor: 'background',
    },
  },
  borders: [0, '3px solid #0D0D0D'],
  buttons: {
    cta: {
      color: 'white',
      backgroundColor: 'primary',
    },
    muted: {
      color: 'text',
      backgroundColor: 'muted',
    },
    danger: {
      color: 'white',
      backgroundColor: 'danger',
    },
    primary: {
      ':disabled': {
        backgroundColor: 'backgroundBrand',
        cursor: 'default',
      },
    },
    secondary: {
      color: 'text',
      backgroundColor: 'white',
      borderColor: 'text',
      borderWidth: 1,
      borderStyle: 'solid',
      ':disabled': {
        opacity: 0.5,
        cursor: 'default',
      },
    },
  },
  cards: {
    primary: {
      backgroundColor: 'background',
      border: '1px solid black',
      padding: [4, 5],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'fit-content',
    },
  },
  forms: {
    input: {
      fontFamily: 'body',
    },
  },
  text: {
    default: {
      color: 'text',
      fontFamily: 'body',
    },
    title: {
      fontFamily: 'heading',
      fontSize: 4,
      lineSpace: '3.5',
    },
    h1: {
      fontFamily: 'heading',
      fontSize: '6xl',
      fontWeight: 'bold',
      letterSpacing: 'normal',
    },
  },
};
