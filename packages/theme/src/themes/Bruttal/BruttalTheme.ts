import { Theme } from 'theme-ui';
import { fontSizes } from '../../tokens/fontSizes';
import { fontWeights } from '../../tokens/fontWeights';
import { letterSpacings } from '../../tokens/letterSpacings';
import { space } from '../../tokens/space';

const coreFonts = {
  main: '"Atkinson Hyperlegible", sans-serif',
  contrast: '"Work Sans", sans-serif',
  monospace: '"Inconsolata", sans-serif',
};

const brandColors = {
  complimentary: '#f5f5f5',
  main: '#292c2a',
  darkNeutral: '#515389',
  accent: '#0000ff',
  lightNeutral: '#e3e3e3',
};

const coreColors = {
  ...brandColors,
  gray100: '#f0f1f3',
  gray200: '#ced1d7',
  gray300: '#acb1ba',
  gray400: '#8b919e',
  gray500: '#6b7280',
  gray600: '#535863',
  gray700: '#3b3f46',
  gray800: '#23252a',
  gray900: '#0b0b0d',
  black: '#000000',
  red100: '#ffebeb',
  red200: '#fdbfbf',
  red300: '#f99595',
  red400: '#f56c6c',
  red500: '#ef4444',
  red600: '#e42828',
  red700: '#c62121',
  white: '#ffffff',
};

const coreBorders = {
  none: '0px solid',
  thin: '1px solid',
  medium: '2px solid',
  thick: '4px solid',
};

const coreRadii = {
  sharp: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  circle: '9999px',
};

export const BruttalTheme: Theme = {
  /**
   * Tokens
   */
  fontSizes,
  fontWeights,
  letterSpacings,
  space,
  colors: {
    background: coreColors.lightNeutral,
    text: coreColors.gray900,
    muted: coreColors.gray200,
    outline: coreColors.gray200,
    primary: coreColors.main,
    onPrimary: coreColors.white,
    secondary: coreColors.gray500,
    onSecondary: coreColors.white,
    highlight: coreColors.darkNeutral,
    onHighlight: coreColors.white,
    accent: coreColors.accent,
    onAccent: coreColors.white,
    neutral: coreColors.white,
    onNeutral: coreColors.gray900,
  },
  fonts: {
    h1: coreFonts.contrast,
    h2: coreFonts.contrast,
    h3: coreFonts.contrast,
    h4: coreFonts.contrast,
    h5: coreFonts.contrast,
    h6: coreFonts.contrast,
    body: coreFonts.main,
    highlight: coreFonts.main,
    caption: coreFonts.monospace,
  },
  borders: {
    default: coreBorders.medium,
  },
  radii: {
    default: coreRadii.sm,
  },
  /**
   * Global styles
   */
  styles: {
    root: {
      fontFamily: 'body',
      fontWeight: 'normal',
    },
  },
  /**
   * Components
   */
  buttons: {
    accent: {
      backgroundColor: 'accent',
      color: 'onAccent',
      fontFamily: 'highlight',
      fontWeight: 'bold',
      border: 'default',
      borderRadius: 'default',
      borderColor: 'accent',
      ':hover:not(:active,[disabled])': {
        backgroundColor: 'highlight',
        color: 'onHighlight',
        borderColor: 'highlight',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
      },
    },
    primary: {
      backgroundColor: 'primary',
      color: 'onPrimary',
      fontFamily: 'body',
      border: 'default',
      borderRadius: 'default',
      borderColor: 'outline',
      ':hover:not(:active,[disabled])': {
        backgroundColor: 'highlight',
        color: 'onHighlight',
        borderColor: 'highlight',
      },
      ':active': {
        backgroundColor: 'primary',
        color: 'onPrimary',
        borderColor: 'outline',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
      },
    },
    secondary: {
      backgroundColor: 'secondary',
      color: 'onSecondary',
      fontFamily: 'body',
      border: 'default',
      borderRadius: 'default',
      borderColor: 'outline',
      ':hover:not(:active,[disabled])': {
        backgroundColor: 'highlight',
        color: 'onHighlight',
        borderColor: 'highlight',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
      },
    },
    neutral: {
      backgroundColor: 'neutral',
      color: 'onNeutral',
      fontFamily: 'body',
      border: 'default',
      borderRadius: 'default',
      borderColor: 'outline',
      ':hover:not(:active,[disabled])': {
        backgroundColor: 'highlight',
        color: 'onHighlight',
        borderColor: 'highlight',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
      },
    },
    danger: {
      color: 'white',
      backgroundColor: 'danger',
    },
  },
  cards: {
    primary: {
      backgroundColor: 'primary',
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
    h2: {
      fontFamily: 'heading',
      fontSize: '5xl',
      fontWeight: 'bold',
      letterSpacing: 'normal',
    },
    h3: {
      fontFamily: 'heading',
      fontSize: '4xl',
      fontWeight: 'bold',
      letterSpacing: 'normal',
    },
    h4: {
      fontFamily: 'heading',
      fontSize: '2xl',
      fontWeight: 'bold',
      letterSpacing: 'normal',
    },
    h5: {
      fontFamily: 'heading',
      fontSize: 'xl',
      fontWeight: 'bold',
      letterSpacing: 'normal',
    },
  },
};
