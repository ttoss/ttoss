export const BruttalStyles = {
  root: {
    fontFamily: 'body',
    fontWeight: 'normal',
    fontSize: 'md',
    zIndex: 'base',
    margin: 0,
    padding: 0,
    backgroundColor: 'navigation.background.primary.default',
    '.react-select__control': {
      border: 'md',
      borderRadius: 'sm',
      lineHeight: 'normal',
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
    a: {
      fontFamily: 'body',
      textDecorationLine: 'underline',
      lineHeight: 'normal',
      color: 'navigation.text.primary.default',
      '&[aria-invalid="true"]': {
        color: 'feedback.text.negative.default',
      },
      '&.quiet:not(:hover)': {
        textDecorationLine: 'none',
      },
      ':visited': {
        color: 'navigation.text.accent.default',
      },
      '&.warning': {
        color: 'feedback.text.caution.default',
      },
    },
  },
};
