import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
  navigateAway: {
    defaultMessage: 'Navigate Away',
    description: 'Button label to navigate away from the form story.',
  },
  navigatedAway: {
    defaultMessage: 'You navigated away successfully!',
    description: 'Success message shown after navigating away from the form.',
  },
  goBackToForm: {
    defaultMessage: 'Go back to form',
    description: 'Button label to return to the form page in the story.',
  },
  formStatus: {
    defaultMessage: 'Form is {state}',
    description: 'Status label that indicates whether the form is dirty.',
  },
  formDirty: {
    defaultMessage: 'dirty - navigation will be blocked',
    description: 'Status text shown when the form has unsaved changes.',
  },
  formClean: {
    defaultMessage: 'clean',
    description: 'Status text for a clean form.',
  },
  firstName: {
    defaultMessage: 'First Name',
    description: 'First name field label in the story.',
  },
  lastName: {
    defaultMessage: 'Last Name',
    description: 'Last name field label in the story.',
  },
  save: {
    defaultMessage: 'Save',
    description: 'Submit button label in the story forms.',
  },
  reset: {
    defaultMessage: 'Reset',
    description: 'Reset button label in the story forms.',
  },
  contactPreference: {
    defaultMessage: 'Contact preference',
    description: 'Label for the contact preference segmented control.',
  },
  billingCycle: {
    defaultMessage: 'Billing cycle',
    description: 'Billing cycle segmented control label.',
  },
  email: {
    defaultMessage: 'Email',
    description: 'Email option label in the segmented control.',
  },
  whatsapp: {
    defaultMessage: 'WhatsApp',
    description: 'WhatsApp option label in the control.',
  },
  phone: {
    defaultMessage: 'Phone',
    description: 'Phone option label in the segmented control.',
  },
  monthly: {
    defaultMessage: 'Monthly',
    description: 'Monthly option label in the segmented control.',
  },
  yearly: {
    defaultMessage: 'Yearly',
    description: 'Yearly option label in the segmented control.',
  },
  customStoryDescription: {
    defaultMessage:
      'This example overrides the modal copy through warnOnUnsavedChanges.',
    description: 'Helper text shown in the custom modal story.',
  },
  customModalTitle: {
    defaultMessage: 'Leave this preferences draft?',
    description: 'Custom title for the unsaved changes modal story variant.',
  },
  customModalBody: {
    defaultMessage:
      'You changed the preferences in this form. Leaving now will discard this draft.',
    description:
      'Custom description for the unsaved changes modal story variant.',
  },
  customModalConfirm: {
    defaultMessage: 'Leave without saving',
    description: 'Custom confirm button label for the modal story variant.',
  },
  customModalCancel: {
    defaultMessage: 'Continue editing',
    description: 'Custom cancel button label for the modal story variant.',
  },
});
