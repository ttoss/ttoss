export const BruttalButtons = {
  accent: {
    backgroundColor: 'action.background.accent.default',
    color: 'action.text.accent.default',
    borderRadius: 'sm',
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
    color: 'action.text.secondary.default',
    borderRadius: 'sm',
    ':hover:not(:active,[disabled])': {
      filter: 'brightness(90%)',
    },
    ':active': {
      backgroundColor: 'action.background.primary.default',
      color: 'action.text.secondary.default',
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
    color: 'action.text.primary.default',
    borderRadius: 'sm',
    border: 'md',
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
  close: {
    color: 'action.background.primary.default',
    ':hover:not(:active,[disabled])': {
      filter: 'brightness(90%)',
      cursor: 'pointer',
    },
    ':active': {
      color: 'action.background.primary.active',
    },
    ':disabled': {
      cursor: 'default',
      color: 'action.background.primary.disabled',
    },
  },
};
