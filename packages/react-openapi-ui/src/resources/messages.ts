import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
  navLabel: {
    defaultMessage: 'Resources',
    description: 'OpenApiApp: accessible name of the resource navigation.',
  },
  create: {
    defaultMessage: 'New',
    description:
      'OpenApiView: button on a resource list that opens the create form.',
  },
  edit: {
    defaultMessage: 'Edit',
    description: 'OpenApiView: button on a record that opens the edit form.',
  },
  back: {
    defaultMessage: 'Back',
    description:
      'OpenApiView: link from a form or record back to where it came from.',
  },
  createTitle: {
    defaultMessage: 'New record',
    description: 'OpenApiView: heading of the create form.',
  },
  editTitle: {
    defaultMessage: 'Edit record',
    description: 'OpenApiView: heading of the edit form.',
  },
  unknownResource: {
    defaultMessage: 'This API has no resource "{resource}".',
    description:
      'OpenApiView: shown when the location names a resource the spec lacks. {resource} is its key.',
  },
  unavailable: {
    defaultMessage: 'This API has no operation for this screen.',
    description:
      'OpenApiView: shown when the spec lacks the operation a screen needs (e.g. no edit operation).',
  },
  specError: {
    defaultMessage: 'Could not load the API description',
    description: 'OpenApiView: title of the error shown when the spec fails.',
  },
  retry: {
    defaultMessage: 'Try again',
    description: 'OpenApiView: button that loads the spec again.',
  },
  noResources: {
    defaultMessage: 'The API describes no resource to show.',
    description:
      'OpenApiApp: shown when the spec has no list operation to navigate to.',
  },
});
