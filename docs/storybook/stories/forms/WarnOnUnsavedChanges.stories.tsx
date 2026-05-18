import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { UseRouterBlockerFn } from '@ttoss/forms';
import {
  Form,
  FormFieldInput,
  FormFieldSegmentedControl,
  useForm,
} from '@ttoss/forms';
import { I18nProvider, useI18n } from '@ttoss/react-i18n';
import { Button, Flex, Text } from '@ttoss/ui';
import type * as React from 'react';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useBlocker,
  useNavigate,
} from 'react-router-dom';
import { action } from 'storybook/actions';

import { messages } from './WarnOnUnsavedChanges.messages';

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

const reactRouterWarnOnUnsavedChanges = {
  useRouterBlocker: useBlocker as unknown as UseRouterBlockerFn,
};

export default {
  title: 'Forms/WarnOnUnsavedChanges',
  component: Form,
  parameters: {
    docs: {
      description: {
        component: `Demonstrates the \`warnOnUnsavedChanges\` prop on \`<Form>\`.

When enabled and the form is dirty (\`formState.isDirty === true\`):
- **In-app navigation** can be intercepted by passing a router blocker hook.
- **Browser refresh / tab close** triggers the native \`beforeunload\` prompt.

This story uses React Router by passing \`useBlocker\` through \`warnOnUnsavedChanges\`.

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
    <Form
      {...formMethods}
      onSubmit={action('onSubmit')}
      warnOnUnsavedChanges={reactRouterWarnOnUnsavedChanges}
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
    <Form
      {...formMethods}
      onSubmit={action('onSubmit')}
      warnOnUnsavedChanges={reactRouterWarnOnUnsavedChanges}
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
        ...reactRouterWarnOnUnsavedChanges,
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

export const Default: StoryFn = () => {
  return renderWarnOnUnsavedChangesStory({ formPage: <FormPage /> });
};

export const SegmentedControl: StoryFn = () => {
  return renderWarnOnUnsavedChangesStory({
    formPage: <SegmentedControlFormPage />,
  });
};

export const CustomModal: StoryFn = () => {
  return renderWarnOnUnsavedChangesStory({ formPage: <CustomModalFormPage /> });
};
