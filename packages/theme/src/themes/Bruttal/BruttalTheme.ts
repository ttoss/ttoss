import { Theme } from 'theme-ui';

import { defaultTheme } from '../default/defaultTheme';

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
  fontSizes: defaultTheme.fontSizes,
  fontWeights: defaultTheme.fontWeights,
  letterSpacings: defaultTheme.letterSpacings,
  space: defaultTheme.space,
  lineHeights: defaultTheme.lineHeights,
  zIndices: defaultTheme.zIndices,
  colors: {
    navigation: {
      backgound: { primary: { default: coreColors.complimentary } },
      text: {
        primary: { default: coreColors.black },
        accent: { default: coreColors.darkNeutral },
        muted: { default: coreColors.gray600 },
        negative: { default: coreColors.red700 },
      },
      border: {
        primary: { default: coreBorders.medium },
      },
    },
    action: {
      text: {
        primary: { default: coreColors.white },
        secondary: {
          default: coreColors.black,
          active: coreColors.complimentary,
        },
        negative: { default: coreColors.white },
        caution: { default: coreColors.white },
        muted: { default: coreColors.gray600 },
      },
      background: {
        primary: {
          default: coreColors.main,
          active: coreColors.complimentary,
        },
        secondary: {
          default: coreColors.gray100,
          active: coreColors.darkNeutral,
        },
        negative: { default: coreColors.red700 },
        accent: {
          default: coreColors.accent,
          active: coreColors.teal600,
        },
        caution: { default: coreColors.amber600 },
        muted: { default: coreColors.gray200 },
      },
      border: {
        primary: { default: coreColors.black },
        secondary: {
          default: coreColors.gray500,
          active: coreColors.darkNeutral,
        },
        muted: { default: coreColors.gray600 },
        accent: { default: coreColors.accent },
      },
    },
    input: {
      text: {
        primary: { default: coreColors.white },
        secondary: { default: coreColors.black },
        muted: {
          default: coreColors.gray200,
          active: coreColors.gray600,
        },
        accent: { default: coreColors.white },
        negative: { default: coreColors.red700 },
      },
      background: {
        primary: {
          default: coreColors.main,
          active: coreColors.complimentary,
        },
        secondary: {
          default: coreColors.gray100,
          active: coreColors.white,
        },
        muted: {
          default: coreColors.gray600,
          active: coreColors.gray200,
        },
        accent: { default: coreColors.accent },
        negative: { default: coreColors.red700 },
      },
      border: {
        primary: { default: coreColors.main },
        secondary: {
          default: coreColors.black,
          active: coreColors.darkNeutral,
        },
        muted: { default: coreColors.gray600 },
        accent: { default: coreColors.accent },
        caution: { default: coreColors.gray500 },
        negative: { default: coreColors.red700 },
      },
    },
    display: {
      background: {
        primary: { default: coreColors.main },
        secondary: { default: coreColors.white },
        muted: { default: coreColors.gray200 },
      },
      text: {
        primary: { default: coreColors.black },
        secondary: { default: coreColors.darkNeutral },
        muted: {
          default: coreColors.gray600,
          active: coreColors.gray200,
        },
        negative: { default: coreColors.red700 },
      },
      border: {
        primary: { default: coreColors.main },
        secondary: { default: coreColors.black },
        muted: {
          default: coreColors.gray600,
          active: coreColors.darkNeutral,
        },
        accent: { default: coreColors.accent },
        negative: { default: coreColors.red700 },
      },
    },
    /**
     * old color tokens
     */
    // background: coreColors.complimentary,
    // text: coreColors.black,
    // muted: coreColors.gray200,
    // onMuted: coreColors.gray600,
    // mutedOutline: coreColors.gray300,
    // danger: coreColors.red700,
    // onDanger: coreColors.white,
    // notice: coreColors.amber600,
    // onNotice: coreColors.white,
    // positive: coreColors.teal600,
    // onPositive: coreColors.white,
    // surface: coreColors.white,
    // contentHeader: coreColors.gray200,
    // onContentHeader: coreColors.black,
    // outline: coreColors.gray500,
    // primary: coreColors.main,
    // onPrimary: coreColors.white,
    // secondary: coreColors.gray100,
    // onSecondary: coreColors.black,
    // highlight: coreColors.darkNeutral,
    // onHighlight: coreColors.complimentary,
    // accent: coreColors.accent,
    // onAccent: coreColors.white,
    // neutral: coreColors.darkNeutral,
    // onNeutral: coreColors.lightNeutral,
    // underemphasize: coreColors.gray300,
  },
  fonts: {
    main: coreColors.main,
    contrast: coreFonts.contrast,
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
      fontSize: 'md',
      zIndex: 'base',
      margin: 0,
      padding: 0,
      backgroundColor: 'navigation.background.primary.default',
      '.react-select__control': {
        border: 'interaction',
        borderRadius: 'active',
      },
      /**
       * HTML elements
       */
      table: {
        borderCollapse: 'collapse',
      },
      th: {
        paddingX: '4',
        paddingY: '4',
      },
      tr: {
        borderBottom: 'default',
      },
      td: {
        paddingX: '6',
        paddingY: '4',
      },
    },
    a: {
      color: 'navigation.text.primary.default',
      fontFamily: 'body',
      textDecorationLine: 'underline',
      lineHeight: 'normal',
      '&.quiet:not(:hover)': {
        textDecorationLine: 'none',
      },
      ':visited': {
        color: 'navigation.text.accent.default',
      },
    },
  },
  /**
   * Components
   */
  badges: {
    positive: {
      color: 'action.text.accent.default',
      bg: 'action.background.accent.active',
    },
    negative: {
      color: 'action.text.negative.default',
      bg: 'action.background.negative.default',
    },
    neutral: {
      color: 'action.text.secondary.default',
      bg: 'action.background.secondary.default',
      border: 'muted',
      borderColor: 'action.border.muted.default',
    },
    informative: {
      color: 'action.text.caution.default',
      bg: 'action.background.caution.default',
    },
    muted: {
      color: 'action.text.muted.default',
      bg: 'action.background.muted.default',
    },
  },
  buttons: {
    accent: {
      backgroundColor: 'action.background.accent.default',
      color: 'action.text.primary.default',
      borderRadius: 'action',
      borderColor: 'action.border.accent.default',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
      },
    },
    primary: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.primary.default',
      borderRadius: 'action',
      borderColor: 'action.border.primary.default',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':active': {
        backgroundColor: 'action.background.primary.default',
        color: 'action.text.primary.default',
        borderColor: 'action.border.secondary.default',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
      },
    },
    secondary: {
      backgroundColor: 'action.background.secondary.default',
      color: 'action.text.secondary.default',
      borderRadius: 'action',
      border: 'secondary',
      borderColor: 'action.border.primary.default',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
      },
    },
    destructive: {
      color: 'action.text.negative.default',
      backgroundColor: 'action.background.negative.default',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
      },
    },
    closeButton: {
      backgroundColor: 'action.background.primary.active',
      color: 'action.text.secondary.default',
      border: 'default',
      borderColor: 'action.border.primary.default',
      borderRadius: 'action',
      ':disabled': {
        border: 'muted',
        backgroundColor: 'action.background.muted.default',
        borderColor: 'action.border.muted.default',
        color: 'action.text.muted.default',
        cursor: 'not-allowed',
      },
      ':is(:focus-within, :hover):not(:disabled)': {
        color: 'action.text.secondary.active',
        backgroundColor: 'action.background.secondary.active',
        borderColor: 'action.border.secondary.active',
      },
    },
    actionButton: {
      default: {
        backgroundColor: 'action.background.secondary.default',
        color: 'action.text.secondary.default',
        border: 'default',
        borderColor: 'action.background.primary.default',
        transition: 'all 0.2s',
        ':is(:focus-within, :hover)': {
          backgroundColor: 'action.background.secondary.active',
          borderColor: 'action.border.secondary.active',
          color: 'action.text.secondary.active',
        },
      },
      accent: {
        backgroundColor: 'action.background.accent.default',
        color: 'action.text.accent.default',
        border: 'none',
      },
      quiet: {
        backgroundColor: 'transparent',
        color: 'action.text.secondary.default',
        border: 'none',
        borderColor: 'transparent',
      },
    },
  },
  cards: {
    primary: {
      backgroundColor: 'display.background.primary.default',
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
      color: 'display.text.primary.default',
      '&:is([aria-disabled="true"])': {
        color: 'display.text.muted.default',
      },
      '& > span[aria-label="tooltip"]': {
        fontSize: 'sm',
        marginLeft: '2',
      },
      '&:has(input[type="checkbox"])': {
        fontSize: 'md',
        gap: '2',
      },
      '& > div:has(input[type="checkbox"]) > svg': {
        marginRight: 0,
      },
      '&:has(input[type="checkbox"]:disabled)': {
        color: 'display.text.muted.default',
      },
      '&:has(div > input[type="radio"])': {
        alignItems: 'center',
      },
      '&:has(div > input[type="radio"]:disabled)': {
        color: 'display.text.muted.active',
      },
    },
    radio: {
      color: 'input.text.secondary.default',
      fontFamily: 'body',
      fontSize: 'lg',
      'input:disabled ~ &': {
        color: 'input.text.muted.default',
      },
      'input[aria-invalid="true"] ~ &': {
        color: 'input.text.negative.default',
      },
      'input:focus ~ &': {
        bg: 'transparent',
      },
      '&:is(svg, svg + svg)': {
        width: 'min',
        height: 'min',
      },
    },
    checkbox: {
      'input:focus ~ &': {
        bg: 'transparent',
      },
      'input:not(:checked) ~ &': {
        color: 'input.text.secondary.default',
      },
      'input:checked ~ &': {
        color: 'input.text.secondary.default',
      },
      'input:disabled ~ &': {
        color: 'input.text.muted.default',
      },
      'input:disabled ~ & path': {
        backgroundColor: 'input.background.muted.default',
      },
      'input[aria-invalid="true"] ~ &': {
        color: 'display.text.negative.default',
      },
      '&:is(svg, svg + svg)': {
        width: 'min',
        height: 'min',
      },
    },
    input: {
      color: 'display.text.primary.default',
      border: 'interaction',
      borderColor: 'display.border.muted.default',
      borderRadius: 'action',
      backgroundColor: 'display.background.secondary.default',
      fontSize: 'md',
      lineHeight: 'normal',
      '::placeholder': {
        color: 'display.text.muted.default',
      },
      ':focus-within': {
        outlineColor: 'display.border.muted.active',
      },
      ':disabled': {
        backgroundColor: 'display.background.muted.default',
        color: 'display.text.muted.default',
        border: 'muted',
        borderColor: 'display.border.muted.default',
      },
      '&[aria-invalid="true"]': {
        borderColor: 'display.border.negative.default',
      },
      '&[aria-invalid="true"] ~ span:has(iconify-icon)': {
        color: 'display.text.negative.default',
      },
    },
    inputNumber: {
      color: 'display.text.primary.default',
      border: 'interaction',
      borderColor: 'display.border.muted.default',
      borderRadius: 'action',
      ':disabled': {
        border: 'muted',
        borderColor: 'display.border.muted.default',
        color: 'display.text.muted.active',
      },
      ':disabled ~ span > iconify-icon': {
        color: 'display.text.muted.active',
        cursor: 'default',
      },
      ':focus-within': {
        outlineColor: 'display.border.muted.active',
      },
      ':not(:disabled, [aria-invalid="true"]):hover': {
        borderColor: 'display.border.muted.active',
      },
      ':not(:disabled, [aria-invalid="true"]) ~ span:has(iconify-icon):hover': {
        color: 'display.text.secondary.default',
      },
      '& ~ span:has(iconify-icon)': {
        fontSize: 'md',
      },
      '&[aria-invalid="true"]': {
        border: 'danger',
        borderColor: 'display.border.negative.default',
        color: 'display.text.negative.default',
        outlineColor: 'display.border.negative.default',
      },
      '&[aria-invalid="true"] ~ span>iconify-icon': {
        color: 'display.text.negative.default',
      },
    },
    select: {
      color: 'display.text.primary.default',
      backgroundColor: 'display.background.secondary.default',
      border: 'interaction',
      borderColor: 'display.border.muted.default',
      borderRadius: 'action',
      ':disabled': {
        border: 'muted',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'display.background.muted.default',
        color: 'display.text.muted.default',
      },
      ':disabled ~ * > span:has(iconify-icon)': {
        color: 'display.text.muted.default',
      },
      '&[aria-invalid="true"]': {
        border: 'danger',
        borderColor: 'display.border.negative.default',
        outlineColor: 'display.border.negative.default',
      },
      '&[aria-invalid="true"] ~ * > span.error-icon': {
        color: 'display.text.negative.default',
      },
    },
    textarea: {
      color: 'navigation.text.primary.default',
      border: 'interaction',
      borderColor: 'input.border.muted.default',
      backgroundColor: 'input.background.secondary.default',
      borderRadius: 'action',
      ':focus-within': {
        outlineColor: 'input.border.primary.default',
      },
      ':disabled::placeholder': {
        color: 'input.text.muted.active',
      },
      ':disabled': {
        borderColor: 'input.border.muted.default',
        backgroundColor: 'input.background.muted.active',
        border: 'muted',
        color: 'input.text.muted.active',
      },
      '&[aria-invalid="true"]': {
        borderColor: 'input.border.negative.default',
        outlineColor: 'input.border.negative.default',
      },
      '&[aria-invalid="true"]+span>iconify-icon': {
        color: 'input.text.negative.default',
        fontSize: 'md',
      },
    },
  },
  text: {
    default: {
      color: 'navigation.text.primary.default',
      fontFamily: 'body',
    },
    title: {
      fontFamily: 'heading',
      fontSize: '5xl',
      lineSpace: '3.5',
    },
    help: {
      color: 'navigation.text.primary.default',
      '&[aria-disabled="true"]': {
        color: 'navigation.text.muted.default',
      },
      negative: {
        color: 'navigation.text.negative.default',
        '&[aria-disabled="true"]': {
          color: 'navigation.text.muted.default',
        },
      },
    },
    headline: {
      fontFamily: 'contrast',
      fontWeight: 'bold',
      lineHeight: 'moderate',
      fontSize: '5xl',
      letterSpacing: 'wide',
    },
    subheadline: {
      fontFamily: 'main',
      fontWeight: 'bold',
      lineHeight: 'normal',
      fontSize: 'xl',
      letterSpacing: 'wide',
    },
    h1: {
      fontFamily: 'contrast',
      fontWeight: 'extrabold',
      lineHeight: 'normal',
      fontSize: '3xl',
      letterSpacing: 'wide',
    },
    h2: {
      fontFamily: 'contrast',
      fontWeight: 'bold',
      lineHeight: 'normal',
      fontSize: '2xl',
      letterSpacing: 'wide',
    },
    h3: {
      fontFamily: 'contrast',
      fontWeight: 'bold',
      lineHeight: 'normal',
      fontSize: 'xl',
      letterSpacing: 'wide',
    },
    h4: {
      fontFamily: 'contrast',
      fontWeight: 'semibold',
      lineHeight: 'normal',
      fontSize: 'lg',
      letterSpacing: 'wide',
    },
    h5: {
      fontFamily: 'contrast',
      fontWeight: 'semibold',
      lineHeight: 'normal',
      fontSize: 'md',
      letterSpacing: 'wide',
    },
  },
};
