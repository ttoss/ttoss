import type { Theme } from '@ttoss/ui';

export const theme: Theme = {
  breakpoints: ['42em', '60em'],
  fonts: {
    body: 'Overlock',
    heading: 'Josefin Sans',
  },
  fontSizes: [7, 10, 12, 17, 22, 29, 39, 51, 68, 90],
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 900,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125,
  },
  radii: {
    none: 0,
    partial: 6,
    full: '100%',
  },
  borderWidths: [0, '1px'],
  colors: {
    transparent: '#ffffff00',
    primary: '#127547',
    secondary: '#457F8D',
    text: '#393A3A',
    background: '#F7F9F8',
    accent: '#00C7FE',
    highlight: '#0067D2',
    muted: '#B9B9B9',
    primaryVariant: '#008774',
    secondaryVariant: '#7AB4C3',
    alert: '#FF655B',
    success: '#66AA00',
    caution: '#FC6C00',
    neutral: '#888888',
    eucalipto: '#E79E49',
    pinus: '#EBC36D',
    cedroAustraliano: '#9F4F2A',
    mognoAfricano: '#C18771',
    teca: '#C19358',
  },
  shadows: ['0', '0px 4px 4px rgba(0, 0, 0, 0.15)'],
  sizes: { container: '68em' },
  zIndices: [0, 10, 100, 1000],
  styles: {
    root: {
      fontFamily: 'body',
      fontWeight: 'body',
    },
  },
};
