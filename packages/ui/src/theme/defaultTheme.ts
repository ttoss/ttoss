import { Theme } from 'theme-ui';

export const defaultTheme: Theme = {
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#07c',
    secondary: '#639',
    gray: '#555',
    muted: '#f6f6f6',
    danger: 'red',
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512, 1024],
  fonts: {
    body: '"Asap", sans-serif',
    heading: '"Overpass", sans-serif',
    monospace: '"Overpass Mono", sans-serif',
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
