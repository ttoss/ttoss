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
  styles: {
    root: {
      fontFamily: 'body',
      fontWeight: 'body',
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
  },
};
