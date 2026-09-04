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

export const BruttalColors = {
  navigation: {
    background: {
      primary: { default: coreColors.complimentary },
      muted: { default: coreColors.complimentary },
    },
    text: {
      primary: { default: coreColors.black },
      accent: { default: coreColors.darkNeutral },
      muted: { default: coreColors.gray600 },
      negative: { default: coreColors.red700 },
    },
  },
  action: {
    text: {
      primary: { default: coreColors.black },
      secondary: {
        default: coreColors.white,
        active: coreColors.complimentary,
      },
      accent: { default: coreColors.white },
      negative: { default: coreColors.white },
      caution: { default: coreColors.white },
      muted: { default: coreColors.gray600 },
    },
    background: {
      primary: {
        default: coreColors.main,
        active: coreColors.gray600,
        disabled: coreColors.gray200,
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
      accent: { default: coreColors.accent },
      negative: { default: coreColors.red700 },
    },
    background: {
      primary: {
        default: coreColors.main,
        active: coreColors.complimentary,
      },
      secondary: {
        default: coreColors.gray200,
        active: coreColors.white,
      },
      muted: {
        default: coreColors.gray600,
        active: coreColors.gray200,
        disabled: coreColors.gray200,
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
      primary: { default: coreColors.white, active: coreColors.main },
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
      accent: coreColors.accent,
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
  feedback: {
    background: {
      primary: { default: coreColors.white },
    },
    text: {
      primary: { default: coreColors.white },
      secondary: { default: coreColors.black },
    },
  },
};
