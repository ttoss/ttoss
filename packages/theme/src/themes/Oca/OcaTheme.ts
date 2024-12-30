import { Theme } from 'theme-ui';
import { defaultTheme } from '../default/defaultTheme';

export const OcaTheme: Theme = {
  /**
   * Tokens
   */
  fontSizes: defaultTheme.fontSizes,
  fontWeights: defaultTheme.fontWeights,
  letterSpacings: defaultTheme.letterSpacings,
  space: defaultTheme.space,
  lineHeights: defaultTheme.lineHeights,
  zIndices: defaultTheme.zIndices,
  radii: defaultTheme.radii,
  colors: {
    navigation: {
      background: {
        primary: { default: '#FFFFFF' },
        muted: { default: '#F3F4F6' },
      },
      text: {
        primary: { default: '#111827' },
        secondary: { default: '#465A69' },
        accent: { default: '#03FF7A' },
        muted: { default: '#6B7280' },
      },
      border: {
        primary: { default: '#E5E7EB' },
        muted: { default: '#9CA3AF' },
      },
    },
    input: {
      border: {
        muted: { default: '#E5E7EB' },
      },
      background: {
        primary: { default: '#FFFFFF' },
        secondary: { default: '#465A69' },
        accent: { default: '#03FF7A' },
        muted: { default: '#F3F4F6' },
        negative: { default: 'red' },
      },
      text: {
        accent: { default: '#03FF7A' },
        secondary: { default: '#465A69' },
        muted: { default: '#6B7280' },
        negative: { default: 'red' },
      },
    },
    action: {
      background: {
        primary: { default: '#111827' },
        secondary: { default: '#465A69' },
        accent: { default: '#03FF7A' },
        muted: { default: '#F3F4F6' },
        negative: { default: 'red' },
      },
      text: {
        primary: { default: '#FFFFFF' },
        accent: { default: '#000000' },
        secondary: { default: '#465A69' },
        muted: { default: '#6B7280' },
        negative: { default: 'red' },
      },
    },
    display: {
      background: {
        primary: { default: '#FFFFFF' },
        muted: { default: '#F3F4F6' },
      },
      text: {
        primary: { default: '#111827' },
        secondary: { default: '#465A69' },
        accent: { default: '#03FF7A' },
        muted: { default: '#6B7280' },
        negative: { default: 'red' },
      },
      border: {
        primary: { default: '#111827' },
        secondary: { default: '#465A69' },
        muted: { default: '#E5E7EB' },
        negative: { default: 'red' },
        accent: { default: '#03FF7A' },
      },
    },
    feedback: {
      text: {
        secondary: { default: '#465A69' },
      },
    },
  },
  fonts: {
    heading: '"Outfit", sans-serif',
    body: '"Source Sans Pro", sans-serif',
    monospace: '"Inconsolata", sans-serif',
  },
  borderWidths: {
    thin: '1px',
    thick: '2px',
    medium: '1.5px',
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
        borderWidth: 'navigation.background.muted.default',
        borderBottomWidth: 'thin',
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
      bg: 'action.background.accent.default',
    },
    negative: {
      color: 'action.text.primary.default',
      bg: 'action.background.negative.default',
    },
    neutral: {
      color: 'action.text.primary.default',
      bg: 'action.background.secondary.default',
    },
    // informative: {
    //   color: 'onNotice',
    //   bg: 'notice',
    // },
    muted: {
      color: 'action.text.secondary.default',
      bg: 'action.background.muted.default',
    },
  },
  buttons: {
    accent: {
      backgroundColor: 'action.background.accent.default',
      color: 'action.text.accent.default',
      borderRadius: 'full',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.secondary.default',
      },
    },
    primary: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.primary.default',
      borderRadius: 'full',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':active': {
        color: 'action.text.primary.default',
        borderColor: 'outline',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.secondary.default',
      },
    },
    secondary: {
      backgroundColor: 'action.background.secondary.default',
      color: 'action.text.prinary.default',
      borderRadius: 'full',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.secondary.default',
      },
    },
    destructive: {
      color: 'action.text.primary.default',
      backgroundColor: 'action.background.negative.default',
      borderRadius: 'lg',
      ':hover:not(:active,[disabled])': {
        filter: 'brightness(90%)',
      },
      ':disabled': {
        cursor: 'default',
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.secondary.default',
      },
    },
    closeButton: {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.primary.default',
      borderRadius: 'lg',
      ':disabled': {
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.secondary.default',
        cursor: 'not-allowed',
      },
      ':is(:focus-within, :hover):not(:disabled)': {
        backgroundColor: 'action.background.secondary.default',
      },
    },
    actionButton: {
      default: {
        backgroundColor: 'action.background.secondary.default',
        color: 'action.text.primary.default',
        transition: 'all 0.2s',
        ':is(:focus-within, :hover)': {
          backgroundColor: 'action.background.primary.default',
          color: 'action.text.primary.default',
        },
      },
      accent: {
        backgroundColor: 'action.background.accent.default',
        color: 'action.text.accent.default',
        border: 'none',
      },
      quiet: {
        backgroundColor: 'action.background.muted.default',
        color: 'action.text.accent.default',
        border: 'none',
      },
    },
  },
  cards: {
    primary: {
      backgroundColor: 'display.background.secondary.default',
      borderWidth: 'thin',
      borderColor: 'display.border.muted.default',
      padding: ['4', '5'],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'fit-content',
    },
  },
  forms: {
    label: {
      fontFamily: 'body',
      color: 'display.text.secondary.default',
      '&:is([aria-disabled="true"])': {
        color: 'input.text.muted.default',
      },
      '& > span[aria-label="tooltip"]': {
        fontSize: 'lg',
        marginLeft: '3',
      },
      '&:has(input[type="checkbox"])': {
        fontSize: 'lg',
        gap: '4',
      },
      '& > div:has(input[type="checkbox"]) > svg': {
        marginRight: 0,
      },
      '&:has(input[type="checkbox"]:disabled)': {
        color: 'input.text.muted.default',
      },
      '&:has(div > input[type="radio"])': {
        alignItems: 'center',
      },
      '&:has(div > input[type="radio"]:disabled)': {
        color: 'input.text.muted.default',
      },
    },
    radio: {
      color: 'input.text.secondary.default',
      fontFamily: 'body',
      fontSize: 'lg',
      'input:disabled ~ &': {
        color: 'input.text.secondary.default',
      },
      'input:checked ~ &': {
        color: 'input.text.accent.default',
      },
      'input[aria-invalid="true"] ~ &': {
        color: 'input.text.negative.default',
      },
      'input:focus ~ &': {
        bg: 'input.background.muted.default',
      },
      '&:is(svg, svg + svg)': {
        width: 'lg',
        height: 'lg',
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
        color: 'input.text.accent.default',
        backgroundColor: 'input.background.secondary.default',
      },
      'input:disabled ~ &': {
        color: 'input.text.muted.default',
      },
      'input:disabled ~ & path': {
        backgroundColor: 'input.text.muted.default',
      },
      'input[aria-invalid="true"] ~ &': {
        color: 'input.text.negative.default',
      },
      '&:is(svg, svg + svg)': {
        width: 'lg',
        height: 'lg',
      },
    },
    input: {
      color: 'display.text.primary.default',
      borderWidth: 'thin',
      borderColor: 'display.border.muted.default',
      borderRadius: 'lg',
      backgroundColor: 'display.background.primary.default',
      fontSize: 'md',
      lineHeight: 'normal',
      '::placeholder': {
        color: 'display.text.muted.default',
      },
      ':focus-within': {
        outlineColor: 'display.border.primary.default',
      },
      ':disabled': {
        backgroundColor: 'display.background.muted.default',
        color: 'display.text.muted.default',
        borderWidth: 'thin',
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
      borderWidth: 'thin',
      borderColor: 'display.border.muted.default',
      borderRadius: 'lg',
      ':disabled': {
        color: 'display.text.muted.default',
      },
      ':disabled ~ span > iconify-icon': {
        color: 'display.text.muted.default',
        cursor: 'default',
      },
      ':focus-within': {
        outlineColor: 'display.border.muted.default',
      },
      ':not(:disabled, [aria-invalid="true"]):hover': {
        borderColor: 'display.border.muted.default',
      },
      ':not(:disabled, [aria-invalid="true"]) ~ span:has(iconify-icon):hover': {
        color: 'display.text.accent.default',
      },
      '& ~ span:has(iconify-icon)': {
        fontSize: 'md',
      },
      '&[aria-invalid="true"]': {
        borderColor: 'display.border.negative.default',
        color: 'display.text.negative.default',
        outlineColor: 'display.border.negative.default',
      },
      '&[aria-invalid="true"] ~ span>iconify-icon': {
        color: 'display.text.negative.default',
      },
    },
    select: {
      color: 'display.text.secondary.default',
      backgroundColor: 'display.background.primary.default',
      borderWidth: 'thin',
      borderColor: 'display.border.muted.default',
      borderRadius: 'full',
      ':disabled': {
        borderColor: 'display.border.muted.default',
        backgroundColor: 'display.background.muted.default',
        color: 'display.text.muted.default',
      },
      ':disabled ~ * > span:has(iconify-icon)': {
        color: 'display.text.muted.default',
      },
      '&[aria-invalid="true"]': {
        borderWidth: 'thin',
        borderColor: 'display.border.negative.default',
        outlineColor: 'display.border.negative.default',
      },
      '&[aria-invalid="true"] ~ * > span.error-icon': {
        color: 'display.text.negative.default',
        fontSize: 'lg',
      },
    },
    textarea: {
      color: 'display.text.primary.default',
      borderWidth: 'thin',
      borderColor: 'display.border.muted.default',
      backgroundColor: 'display.background.primary.default',
      borderRadius: 'lg',
      ':focus-within': {
        outlineColor: 'display.border.primary.default',
      },
      ':disabled::placeholder': {
        color: 'display.text.muted.default',
      },
      ':disabled': {
        borderWidth: 'thin',
        backgroundColor: 'display.background.muted.default',
        border: 'display.border.muted.default',
        color: 'display.text.muted.default',
      },
      '&[aria-invalid="true"]': {
        borderColor: 'display.border.negative.default',
        outlineColor: 'display.border.negative.default',
      },
      '&[aria-invalid="true"]+span>iconify-icon': {
        color: 'display.text.negative.default',
        fontSize: 'lg',
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
      fontSize: 4,
      lineSpace: 'wide',
    },
    help: {
      color: 'display.text.muted.default',
      '&[aria-disabled="true"]': {
        color: 'display.text.muted.default',
      },
      negative: {
        color: 'display.text.negative.default',
        '&[aria-disabled="true"]': {
          color: 'display.text.muted.default',
        },
      },
    },
    headline: {
      fontFamily: 'heading',
      fontWeight: 'bold',
      lineHeight: 'short',
      fontSize: '4xl',
      letterSpacing: 'normal',
    },
    subheadline: {
      fontFamily: 'body',
      fontWeight: 'bold',
      lineHeight: 'normal',
      fontSize: 'xl',
      letterSpacing: 'normal',
    },
    h1: {
      fontFamily: 'body',
      fontWeight: 'extrabold',
      lineHeight: 'normal',
      fontSize: '3xl',
      letterSpacing: 'normal',
    },
    h2: {
      fontFamily: 'body',
      fontWeight: 'bold',
      lineHeight: 'normal',
      fontSize: '2xl',
      letterSpacing: 'normal',
    },
    h3: {
      fontFamily: 'body',
      fontWeight: 'bold',
      lineHeight: 'normal',
      fontSize: 'xl',
      letterSpacing: 'wide',
    },
    h4: {
      fontFamily: 'body',
      fontWeight: 'semibold',
      lineHeight: 'normal',
      fontSize: 'lg',
      letterSpacing: 'wide',
    },
    h5: {
      fontFamily: 'body',
      fontWeight: 'semibold',
      lineHeight: 'normal',
      fontSize: 'md',
      letterSpacing: 'wide',
    },
  },
};
