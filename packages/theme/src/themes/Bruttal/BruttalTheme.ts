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
  complimentary: '#f4f3f3',
  main: '#292C2a',
  darkNeutral: '#325C82',
  accent: '#0469E3',
  lightNeutral: '#F8F8F8',
};

const coreColors = {
  ...brandColors,
  gray100: '#f9f9f9',
  gray200: '#dedede',
  gray300: '#c4c4c4',
  gray400: '#ababab',
  gray500: '#929292',
  gray600: '#7a7a7a',
  gray700: '#626262',
  gray800: '#4c4c4c',
  gray900: '#323232',
  black: '#000000',
  red100: '#ffebeb',
  red200: '#fdbfbf',
  red300: '#f99595',
  red400: '#f56c6c',
  red500: '#ef4444',
  red600: '#e42828',
  red700: '#c62121',
  white: '#ffffff',
  amber600: '#d97706',
  teal600: '#0d9488',
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
    background: coreColors.white,
    text: coreColors.black,
    muted: coreColors.gray200,
    onMuted: coreColors.gray500,
    mutedOutline: coreColors.gray300,
    danger: coreColors.red700,
    onDanger: coreColors.white,
    notice: coreColors.amber600,
    positive: coreColors.teal600,
    surface: coreColors.white,
    contentHeader: coreColors.gray200,
    onContentHeader: coreColors.black,
    outline: coreColors.gray500,
    primary: coreColors.main,
    onPrimary: coreColors.white,
    secondary: coreColors.gray500,
    onSecondary: coreColors.complimentary,
    highlight: coreColors.darkNeutral,
    onHighlight: coreColors.complimentary,
    accent: coreColors.accent,
    onAccent: coreColors.white,
    neutral: coreColors.darkNeutral,
    onNeutral: coreColors.lightNeutral,
    underemphasize: coreColors.gray300,
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
    label: {
      '&:has(+ div > input:invalid)': {
        'span > iconify-icon': {
          color: 'danger',
        },
      },
    },
    input: {
      fontFamily: 'body',
      color: 'text',
      paddingY: 'md',
      paddingX: 'lg',
      '::placeholder': {
        color: 'underemphasize',
      },
      ':focus-within': {
        outlineColor: 'neutral',
      },
      ':disabled': {
        backgroundColor: 'onMuted',
        borderColor: 'muted',
      },
      '&.error': {
        borderColor: 'danger',
      },
      '&.error+span>iconify-icon': {
        color: 'danger',
      },
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
    error: {
      '&[role="alert"]': {
        color: 'danger',
      },
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
