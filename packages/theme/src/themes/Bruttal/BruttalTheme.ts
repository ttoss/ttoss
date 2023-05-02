import { Theme } from 'theme-ui';
import { fontSizes } from '../../tokens/fontSizes';
import { fontWeights } from '../../tokens/fontWeights';
import { letterSpacings } from '../../tokens/letterSpacings';
import { lineHeights } from '../../tokens/lineHeights';
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
  lineHeights,
  colors: {
    background: coreColors.white,
    text: coreColors.black,
    muted: coreColors.gray200,
    onMuted: coreColors.gray600,
    mutedOutline: coreColors.gray300,
    danger: coreColors.red700,
    onDanger: coreColors.white,
    notice: coreColors.amber600,
    onNotice: coreColors.white,
    positive: coreColors.teal600,
    onPositive: coreColors.white,
    surface: coreColors.white,
    contentHeader: coreColors.gray200,
    onContentHeader: coreColors.black,
    outline: coreColors.gray500,
    primary: coreColors.main,
    onPrimary: coreColors.white,
    secondary: coreColors.gray100,
    onSecondary: coreColors.black,
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
    caption: coreFonts.main,
  },
  borders: {
    default: coreBorders.thin,
    secondary: coreBorders.medium,
    muted: coreBorders.thin,
    interaction: coreBorders.medium,
    danger: coreBorders.medium,
    highlight: coreBorders.medium,
  },
  radii: {
    informative: coreRadii.xs,
    default: coreRadii.sm,
    action: coreRadii.sm,
  },
  /**
   * Global styles
   */
  styles: {
    root: {
      fontFamily: 'body',
      fontWeight: 'normal',
      fontSize: 'base',
      margin: 0,
      padding: 0,
    },
    a: {
      color: 'text',
      fontFamily: 'body',
      '&.quiet:not(:hover)': {
        textDecorationLine: 'none',
      },
      ':visited': {
        color: 'highlight',
      },
    },
  },
  /**
   * Components
   */
  badges: {
    positive: {
      color: 'onPositive',
      bg: 'positive',
      fontFamily: 'caption',
      fontWeight: 'normal',
      lineHeight: 'base',
      fontSize: 'xs',
      paddingX: 'xs',
      paddingY: '2xs',
      borderRadius: 'informative',
    },
    negative: {
      color: 'onDanger',
      bg: 'danger',
      fontFamily: 'caption',
      fontWeight: 'normal',
      lineHeight: 'base',
      fontSize: 'xs',
      paddingX: 'xs',
      paddingY: '2xs',
      borderRadius: 'informative',
    },
    neutral: {
      color: 'onSecondary',
      bg: 'secondary',
      fontFamily: 'caption',
      fontSize: 'xs',
      fontWeight: 'normal',
      lineHeight: 'base',
      paddingX: 'xs',
      paddingY: '2xs',
      borderRadius: 'informative',
      border: 'muted',
      borderColor: 'onMuted',
    },
    informative: {
      color: 'onNotice',
      bg: 'notice',
      fontFamily: 'caption',
      fontWeight: 'normal',
      lineHeight: 'base',
      fontSize: 'xs',
      paddingX: 'xs',
      paddingY: '2xs',
      borderRadius: 'informative',
    },
  },
  buttons: {
    accent: {
      backgroundColor: 'accent',
      color: 'onAccent',
      borderRadius: 'action',
      borderColor: 'accent',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
        color: 'onMuted',
      },
    },
    primary: {
      backgroundColor: 'primary',
      color: 'onPrimary',
      borderRadius: 'action',
      borderColor: 'primary',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
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
        color: 'onMuted',
      },
    },
    secondary: {
      backgroundColor: 'secondary',
      color: 'onSecondary',
      borderRadius: 'action',
      border: 'secondary',
      borderColor: 'onSecondary',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
        color: 'onMuted',
      },
    },
    destructive: {
      color: 'onDanger',
      backgroundColor: 'danger',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'muted',
        borderColor: 'muted',
        color: 'onMuted',
      },
    },
    closeButton: {
      backgroundColor: 'background',
      fontFamily: 'caption',
      color: 'primary',
      fontSize: 'xs',
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'pointer',
      gap: 'sm',
      padding: 'sm',
      border: 'default',
      borderColor: 'primary',
      width: 'fit-content',
      ':disabled': {
        border: 'muted',
        backgroundColor: 'muted',
        color: 'onMuted',
        cursor: 'not-allowed',
      },
      ':is(:focus-within, :hover):not(:disabled)': {
        color: 'onHighlight',
        backgroundColor: 'highlight',
        border: 'highlight',
        borderColor: 'highlight',
      },
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
      color: 'text',
      fontFamily: 'body',
      alignItems: 'center',
      fontSize: 'base',
      '&:is([aria-disabled="true"])': {
        color: 'onMuted',
      },
      '& > span[aria-label="tooltip"]': {
        fontSize: 'xs',
        marginLeft: '2xs',
      },
      '&:has(input[type="checkbox"]:disabled)': {
        color: 'onMuted',
      },
      '&:has(div > input[type="radio"])': {
        alignItems: 'center',
      },
      '&:has(div > input[type="radio"]:disabled)': {
        color: 'muted',
      },
    },
    radio: {
      color: 'text',
      fontFamily: 'body',
      fontSize: 'lg',
      'input:disabled ~ &': {
        color: 'muted',
      },
      'input[aria-invalid="true"] ~ &': {
        color: 'danger',
      },
      'input:focus ~ &': {
        bg: 'transparent',
      },
      '&:is(svg, svg + svg)': {
        width: fontSizes.base,
        height: fontSizes.base,
      },
    },
    checkbox: {
      'input:focus ~ &': {
        bg: 'transparent',
      },
      'input:not(:checked) ~ &': {
        color: 'primary',
      },
      'input:disabled ~ &': {
        color: 'muted',
      },
      'input:disabled ~ & path': {
        backgroundColor: 'onMuted',
      },
      'input[aria-invalid="true"] ~ &': {
        color: 'danger',
      },
      '&:is(svg, svg + svg)': {
        width: fontSizes.base,
        height: fontSizes.base,
      },
    },
    input: {
      fontFamily: 'body',
      color: 'text',
      border: 'interaction',
      borderColor: 'onMuted',
      borderRadius: 'action',
      paddingY: 'lg',
      paddingX: 'xl',
      backgroundColor: 'surface',
      '::placeholder': {
        color: 'onMuted',
      },
      ':focus-within': {
        outlineColor: 'neutral',
      },
      ':disabled': {
        backgroundColor: 'muted',
        border: 'muted',
        borderColor: 'onMuted',
      },
      '&.error': {
        borderColor: 'danger',
      },
      '&.error+span>iconify-icon': {
        color: 'danger',
      },
    },
    inputNumber: {
      fontFamily: 'body',
      color: 'text',
      border: 'interaction',
      borderColor: 'onMuted',
      borderRadius: 'action',
      paddingY: 'lg',
      paddingX: 'xl',
      ':disabled': {
        border: 'muted',
        borderColor: 'onMuted',
        color: 'muted',
      },
      ':disabled ~ span > iconify-icon': {
        color: 'muted',
        cursor: 'default',
      },
      ':focus-within': {
        outlineColor: 'highlight',
      },
      ':not(:disabled, [aria-invalid="true"]):hover': {
        borderColor: 'highlight',
      },
      ':not(:disabled, [aria-invalid="true"]) ~ span:has(iconify-icon):hover': {
        color: 'highlight',
      },
      '& ~ span:has(iconify-icon)': {
        fontSize: 'base',
      },
      '&[aria-invalid="true"]': {
        border: 'danger',
        borderColor: 'danger',
        color: 'danger',
        outlineColor: 'danger',
      },
      '&[aria-invalid="true"] ~ span>iconify-icon': {
        color: 'danger',
      },
    },
    select: {
      color: 'text',
      fontFamily: 'body',
      backgroundColor: 'surface',
      border: 'interaction',
      borderColor: 'onMuted',
      width: '100%',
      paddingY: 'lg',
      paddingX: 'xl',
      borderRadius: 'action',
      ':disabled': {
        border: 'muted',
        borderColor: 'onMuted',
        backgroundColor: 'muted',
        color: 'onMuted',
      },
      ':disabled ~ span:has(iconify-icon)': {
        color: 'onMuted',
      },
      '&[aria-invalid="true"]': {
        border: 'danger',
        borderColor: 'danger',
        outlineColor: 'danger',
      },
      '&[aria-invalid="true"] ~ span.error-icon': {
        color: 'danger',
      },
    },
    textarea: {
      fontFamily: 'body',
      color: 'text',
      border: 'interaction',
      borderColor: 'onMuted',
      backgroundColor: 'surface',
      paddingY: 'lg',
      paddingX: 'xl',
      borderRadius: 'action',
      ':focus-within': {
        outlineColor: 'primary',
      },
      ':disabled::placeholder': {
        color: 'onMuted',
      },
      ':disabled': {
        borderColor: 'onMuted',
        backgroundColor: 'muted',
        border: 'muted',
        color: 'onMuted',
      },

      '&[aria-invalid="true"]': {
        borderColor: 'danger',
        outlineColor: 'danger',
      },
      '&[aria-invalid="true"]+span>iconify-icon': {
        color: 'danger',
        fontSize: 'base',
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
    help: {
      fontFamily: 'caption',
      color: 'text',
      fontSize: 'xs',
      '&[aria-disabled="true"]': {
        color: 'onMuted',
      },
      negative: {
        color: 'danger',
        fontFamily: 'caption',
        fontSize: 'xs',
        '&[aria-disabled="true"]': {
          color: 'onMuted',
        },
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
