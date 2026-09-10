export const BruttalForms = {
  label: {
    color: 'display.text.primary.default',
    '&:is([aria-disabled="true"])': {
      color: 'display.text.muted.default',
    },
    '& > span[aria-label="tooltip"]': {
      fontSize: 'sm',
      marginLeft: '2',
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
    'input:checked ~ &': {
      color: 'input.text.accent.default',
    },
    'input[aria-invalid="true"] ~ &': {
      color: 'input.text.negative.default',
    },
    'input:focus ~ &': {
      bg: 'transparent',
    },
    '&:is(svg, svg + svg)': {
      width: '16px',
      height: '16px',
      flexShrink: 0,
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
      width: '16px',
      height: '16px',
      flexShrink: 0,
    },
  },
  input: {
    color: 'display.text.primary.default',
    border: 'md',
    borderColor: 'display.border.muted.default',
    borderRadius: 'sm',
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
      border: 'sm',
      borderColor: 'display.border.muted.default',
    },
    '&[aria-invalid="true"]': {
      borderColor: 'display.border.negative.default',
      ':focus-within': {
        outlineColor: 'display.border.negative.default',
      },
    },
    '&[aria-invalid="true"] ~ span:has(iconify-icon)': {
      color: 'display.text.negative.default',
    },
    '.is-warning &': {
      border: 'md',
      borderColor: 'feedback.border.caution.active',
      ':focus-within': {
        outlineColor: 'feedback.border.caution.active',
      },
    },
  },
  inputNumber: {
    color: 'display.text.primary.default',
    border: 'md',
    borderColor: 'display.border.muted.default',
    borderRadius: 'sm',
    ':disabled': {
      border: 'sm',
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
      color: 'display.text.accent.default',
    },
    '& ~ span:has(iconify-icon)': {
      fontSize: 'md',
    },
    '&[aria-invalid="true"]': {
      border: 'md',
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
    border: 'md',
    borderColor: 'display.border.muted.default',
    borderRadius: 'sm',
    ':disabled': {
      border: 'sm',
      borderColor: 'display.border.muted.default',
      backgroundColor: 'display.background.muted.default',
      color: 'display.text.muted.default',
    },
    ':disabled ~ * > span:has(iconify-icon)': {
      color: 'display.text.muted.default',
    },
    '&[aria-invalid="true"]': {
      border: 'md',
      borderColor: 'display.border.negative.default',
      outlineColor: 'display.border.negative.default',
    },
    '&[aria-invalid="true"] ~ * > span.error-icon': {
      color: 'display.text.negative.default',
    },
  },
  textarea: {
    color: 'display.text.primary.default',
    border: 'md',
    borderColor: 'input.border.muted.default',
    backgroundColor: 'display.background.secondary.default',
    borderRadius: 'sm',
    ':focus-within': {
      outlineColor: 'input.border.primary.default',
    },
    ':disabled::placeholder': {
      color: 'input.text.muted.active',
    },
    ':disabled': {
      borderColor: 'input.border.muted.default',
      backgroundColor: 'input.background.muted.active',
      border: 'sm',
      color: 'input.text.muted.active',
    },
    '&[aria-invalid="true"]': {
      borderColor: 'input.border.negative.default',
      outlineColor: 'input.border.negative.default',
    },
    '&[aria-invalid="true"]+span>iconify-icon': {
      color: 'input.text.negative.default',
      fontSize: 'lg',
    },
  },
};
