import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
  loadError: {
    defaultMessage: 'Could not load the record',
    description:
      'OpenApiDetail: title of the error shown when the request fails.',
  },
  retry: {
    defaultMessage: 'Try again',
    description: 'OpenApiDetail: button that retries a failed request.',
  },
  notFound: {
    defaultMessage: 'Record not found.',
    description: 'OpenApiDetail: shown when the response holds no record.',
  },
  reveal: {
    defaultMessage: 'Show',
    description: 'OpenApiDetail: button revealing a masked sensitive value.',
  },
  conceal: {
    defaultMessage: 'Hide',
    description: 'OpenApiDetail: button masking a revealed sensitive value.',
  },
  revealLabel: {
    defaultMessage: 'Show {field}',
    description:
      'OpenApiDetail: accessible name of the reveal button. {field} is the field label.',
  },
  delete: {
    defaultMessage: 'Delete',
    description: 'OpenApiDeleteButton: default button label.',
  },
  deleting: {
    defaultMessage: 'Deleting…',
    description:
      'OpenApiDeleteButton: confirm button label while the request is in flight.',
  },
  confirmTitle: {
    defaultMessage: 'Delete {name}?',
    description:
      'OpenApiDeleteButton: confirmation dialog title. {name} names the record.',
  },
  confirmTitleGeneric: {
    defaultMessage: 'Delete this record?',
    description:
      'OpenApiDeleteButton: confirmation dialog title when the record has no name.',
  },
  confirmDescription: {
    defaultMessage: 'This action cannot be undone.',
    description: 'OpenApiDeleteButton: confirmation dialog description.',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'OpenApiDeleteButton: dismisses the confirmation dialog.',
  },
  deleteError: {
    defaultMessage: 'Could not delete',
    description:
      'OpenApiDeleteButton: title of the error shown when the request fails.',
  },
});
