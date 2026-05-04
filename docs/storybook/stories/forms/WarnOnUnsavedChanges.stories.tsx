import type { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldInput,
  FormFieldSegmentedControl,
  useForm,
} from '@ttoss/forms';
import { defineMessages, I18nProvider, useI18n } from '@ttoss/react-i18n';
import { Button, Flex, Text } from '@ttoss/ui';
import type * as React from 'react';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from 'react-router-dom';
import { action } from 'storybook/actions';

const loadLocaleData = async (locale: string) => {
  switch (locale) {
    case 'pt-BR': {
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    }
    default: {
      return (await import('../../i18n/compiled/en.json')).default;
    }
  }
};

const messages = defineMessages({
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
    description: 'Status text shown when the form has no unsaved changes.',
  },
  firstName: {
    defaultMessage: 'First Name',
    description: 'Label for the first name input field in the story.',
  },
  lastName: {
    defaultMessage: 'Last Name',
    description: 'Label for the last name input field in the story.',
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
    description: 'Label for the billing cycle segmented control.',
  },
  email: {
    defaultMessage: 'Email',
    description: 'Email option label in the segmented control.',
  },
  whatsapp: {
    defaultMessage: 'WhatsApp',
    description: 'WhatsApp option label in the segmented control.',
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

export default {
  title: 'Forms/WarnOnUnsavedChanges',
  component: Form,
  parameters: {
    docs: {
      description: {
        component: `Demonstrates the \`warnOnUnsavedChanges\` prop on \`<Form>\`.

When enabled and the form is dirty (\`formState.isDirty === true\`):
- **In-app navigation** (React Router) is intercepted with a confirmation modal.
- **Browser refresh / tab close** triggers the native \`beforeunload\` prompt.

Use the default story for text inputs, the segmented control story for selection changes, or the custom modal story to see overridden modal copy.`,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => {
      return (
        <I18nProvider locale="en" loadLocaleData={loadLocaleData}>
          <Story />
        </I18nProvider>
      );
    },
  ],
} as Meta;

const NavigateButton = () => {
  const { intl } = useI18n();
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      variant="accent"
      onClick={() => {
        navigate('/other');
      }}
    >
      {intl.formatMessage(messages.navigateAway)}
    </Button>
  );
};

const OtherPage = () => {
  const { intl } = useI18n();
  const navigate = useNavigate();
  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '400px' }}>
      <Text sx={{ fontSize: '3', fontWeight: 'bold' }}>
        {intl.formatMessage(messages.navigatedAway)}
      </Text>
      <Button
        type="button"
        onClick={() => {
          navigate('/');
        }}
      >
        {intl.formatMessage(messages.goBackToForm)}
      </Button>
    </Flex>
  );
};

const FormPage = () => {
  const { intl } = useI18n();
  const formMethods = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const { isDirty } = formMethods.formState;

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')} warnOnUnsavedChanges>
      <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '400px' }}>
        <Text
          sx={{
            padding: '3',
            borderRadius: 'default',
            backgroundColor: isDirty ? 'highlight' : 'muted',
          }}
        >
          {intl.formatMessage(messages.formStatus, {
            state: intl.formatMessage(
              isDirty ? messages.formDirty : messages.formClean
            ),
          })}
        </Text>
        <FormFieldInput
          name="firstName"
          label={intl.formatMessage(messages.firstName)}
        />
        <FormFieldInput
          name="lastName"
          label={intl.formatMessage(messages.lastName)}
        />
        <Flex sx={{ gap: '3' }}>
          <Button type="submit">{intl.formatMessage(messages.save)}</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              formMethods.reset();
            }}
          >
            {intl.formatMessage(messages.reset)}
          </Button>
          <NavigateButton />
        </Flex>
      </Flex>
    </Form>
  );
};

const SegmentedControlFormPage = () => {
  const { intl } = useI18n();
  const formMethods = useForm({
    defaultValues: {
      contactPreference: 'email',
      billingCycle: 'monthly',
    },
  });

  const { isDirty } = formMethods.formState;

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')} warnOnUnsavedChanges>
      <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '400px' }}>
        <Text
          sx={{
            padding: '3',
            borderRadius: 'default',
            backgroundColor: isDirty ? 'highlight' : 'muted',
          }}
        >
          {intl.formatMessage(messages.formStatus, {
            state: intl.formatMessage(
              isDirty ? messages.formDirty : messages.formClean
            ),
          })}
        </Text>
        <FormFieldSegmentedControl
          name="contactPreference"
          label={intl.formatMessage(messages.contactPreference)}
          options={[
            { label: intl.formatMessage(messages.email), value: 'email' },
            {
              label: intl.formatMessage(messages.whatsapp),
              value: 'whatsapp',
            },
            { label: intl.formatMessage(messages.phone), value: 'phone' },
          ]}
        />
        <FormFieldSegmentedControl
          name="billingCycle"
          label={intl.formatMessage(messages.billingCycle)}
          options={[
            { label: intl.formatMessage(messages.monthly), value: 'monthly' },
            { label: intl.formatMessage(messages.yearly), value: 'yearly' },
          ]}
        />
        <Flex sx={{ gap: '3' }}>
          <Button type="submit">{intl.formatMessage(messages.save)}</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              formMethods.reset();
            }}
          >
            {intl.formatMessage(messages.reset)}
          </Button>
          <NavigateButton />
        </Flex>
      </Flex>
    </Form>
  );
};

const CustomModalFormPage = () => {
  const { intl } = useI18n();
  const formMethods = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const { isDirty } = formMethods.formState;

  return (
    <Form
      {...formMethods}
      onSubmit={action('onSubmit')}
      warnOnUnsavedChanges={{
        title: intl.formatMessage(messages.customModalTitle),
        description: intl.formatMessage(messages.customModalBody),
        confirmLabel: intl.formatMessage(messages.customModalConfirm),
        cancelLabel: intl.formatMessage(messages.customModalCancel),
      }}
    >
      <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '400px' }}>
        <Text
          sx={{
            padding: '3',
            borderRadius: 'default',
            backgroundColor: isDirty ? 'highlight' : 'muted',
          }}
        >
          {intl.formatMessage(messages.formStatus, {
            state: intl.formatMessage(
              isDirty ? messages.formDirty : messages.formClean
            ),
          })}
        </Text>
        <Text>{intl.formatMessage(messages.customStoryDescription)}</Text>
        <FormFieldInput
          name="firstName"
          label={intl.formatMessage(messages.firstName)}
        />
        <FormFieldInput
          name="lastName"
          label={intl.formatMessage(messages.lastName)}
        />
        <Flex sx={{ gap: '3' }}>
          <Button type="submit">{intl.formatMessage(messages.save)}</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              formMethods.reset();
            }}
          >
            {intl.formatMessage(messages.reset)}
          </Button>
          <NavigateButton />
        </Flex>
      </Flex>
    </Form>
  );
};

const Layout = () => {
  return <Outlet />;
};

const renderWarnOnUnsavedChangesStory = ({
  formPage,
}: {
  formPage: React.ReactElement;
}) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: formPage },
          { path: 'other', element: <OtherPage /> },
        ],
      },
    ],
    { initialEntries: ['/'] }
  );

  return <RouterProvider router={router} />;
};

/**
 * Type in a field, then click **Navigate Away** to see the confirmation modal.
 * Choose "Discard" to navigate or "Keep editing" to stay on the form.
 */
export const Default: StoryFn = () => {
  return renderWarnOnUnsavedChangesStory({ formPage: <FormPage /> });
};

/**
 * Change a segmented control option, then click **Navigate Away** to see the
 * confirmation modal. Choose "Discard" to navigate or "Keep editing" to stay
 * on the form.
 */
export const SegmentedControl: StoryFn = () => {
  return renderWarnOnUnsavedChangesStory({
    formPage: <SegmentedControlFormPage />,
  });
};

/**
 * Type in a field, then click **Navigate Away** to see a custom confirmation
 * modal rendered from `warnOnUnsavedChanges` message overrides.
 */
export const CustomModal: StoryFn = () => {
  return renderWarnOnUnsavedChangesStory({
    formPage: <CustomModalFormPage />,
  });
};
