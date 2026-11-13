import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
  submit: {
    defaultMessage: 'Save',
    description: 'OpenApiForm: default submit button label.',
  },
  submitting: {
    defaultMessage: 'Saving…',
    description:
      'OpenApiForm: submit button label while the request is in flight.',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'OpenApiForm: cancel button label.',
  },
  success: {
    defaultMessage: 'Saved successfully.',
    description: 'OpenApiForm: confirmation shown after a successful submit.',
  },
  submitError: {
    defaultMessage: 'Could not save',
    description:
      'OpenApiForm: title of the error shown when the request fails.',
  },
  invalidForm: {
    defaultMessage: 'Fix the highlighted fields and try again.',
    description:
      'OpenApiForm: summary shown when client-side validation fails.',
  },
  loadError: {
    defaultMessage: 'Could not load the record',
    description:
      'OpenApiForm: title of the error shown when loading the record to edit fails.',
  },
  noFields: {
    defaultMessage: 'This operation takes no input.',
    description:
      'OpenApiForm: shown when the operation has no request body fields.',
  },
  selectPlaceholder: {
    defaultMessage: 'Select…',
    description: 'OpenApiForm: empty option of a select field.',
  },
  required: {
    defaultMessage: 'required',
    description: 'OpenApiForm: accessible text of the required-field marker.',
  },
  errorRequired: {
    defaultMessage: 'This field is required.',
    description: 'OpenApiForm: validation error for an empty required field.',
  },
  errorInvalidNumber: {
    defaultMessage: 'Enter a valid number.',
    description: 'OpenApiForm: validation error for a non-numeric value.',
  },
  errorNotInteger: {
    defaultMessage: 'Enter a whole number.',
    description:
      'OpenApiForm: validation error for a decimal in an integer field.',
  },
  errorMinimum: {
    defaultMessage: 'Must be at least {limit}.',
    description:
      'OpenApiForm: validation error for a number below the minimum.',
  },
  errorMaximum: {
    defaultMessage: 'Must be at most {limit}.',
    description:
      'OpenApiForm: validation error for a number above the maximum.',
  },
  errorMinLength: {
    defaultMessage:
      'Must have at least {limit, plural, one {# character} other {# characters}}.',
    description:
      'OpenApiForm: validation error for text shorter than minLength.',
  },
  errorMaxLength: {
    defaultMessage:
      'Must have at most {limit, plural, one {# character} other {# characters}}.',
    description:
      'OpenApiForm: validation error for text longer than maxLength.',
  },
  errorPattern: {
    defaultMessage: 'Invalid format.',
    description:
      'OpenApiForm: validation error for text not matching the pattern.',
  },
  errorInvalidJson: {
    defaultMessage: 'Invalid JSON.',
    description:
      'OpenApiForm: validation error for a JSON field that does not parse.',
  },
  errorJsonType: {
    defaultMessage:
      'Must be a JSON {expected, select, array {array} other {object}}.',
    description: 'OpenApiForm: validation error for JSON of the wrong shape.',
  },
});
