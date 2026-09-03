export const BruttalText = {
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
    fontFamily: 'heading',
    fontWeight: 'bold',
    lineHeight: 'moderate',
    fontSize: '5xl',
    letterSpacing: 'wide',
  },
  subheadline: {
    fontFamily: 'body',
    fontWeight: 'bold',
    lineHeight: 'normal',
    fontSize: 'xl',
    letterSpacing: 'wide',
  },
  h1: {
    fontFamily: 'heading',
    fontWeight: 'extrabold',
    lineHeight: 'normal',
    fontSize: '3xl',
    letterSpacing: 'wide',
  },
  h2: {
    fontFamily: 'heading',
    fontWeight: 'bold',
    lineHeight: 'normal',
    fontSize: '2xl',
    letterSpacing: 'wide',
  },
  h3: {
    fontFamily: 'heading',
    fontWeight: 'bold',
    lineHeight: 'normal',
    fontSize: 'xl',
    letterSpacing: 'wide',
  },
  h4: {
    fontFamily: 'heading',
    fontWeight: 'semibold',
    lineHeight: 'normal',
    fontSize: 'lg',
    letterSpacing: 'wide',
  },
  h5: {
    fontFamily: 'heading',
    fontWeight: 'semibold',
    lineHeight: 'normal',
    fontSize: 'md',
    letterSpacing: 'wide',
  },
};
