import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Form, FormFieldInput, useForm } from '@ttoss/forms';
import { I18nProvider } from '@ttoss/react-i18n';
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

Type in any field below, then click **Navigate Away** to see the confirmation modal.`,
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
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      variant="accent"
      onClick={() => {
        navigate('/other');
      }}
    >
      Navigate Away
    </Button>
  );
};

const OtherPage = () => {
  const navigate = useNavigate();
  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '400px' }}>
      <Text sx={{ fontSize: '3', fontWeight: 'bold' }}>
        ✅ You navigated away successfully!
      </Text>
      <Button
        type="button"
        onClick={() => {
          navigate('/');
        }}
      >
        Go back to form
      </Button>
    </Flex>
  );
};

const FormPage = () => {
  const formMethods = useForm({
    defaultValues: { firstName: '', lastName: '' },
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
          Form is {isDirty ? 'dirty — navigation will be blocked' : 'clean'}
        </Text>
        <FormFieldInput name="firstName" label="First Name" />
        <FormFieldInput name="lastName" label="Last Name" />
        <Flex sx={{ gap: '3' }}>
          <Button type="submit">Save</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              formMethods.reset();
            }}
          >
            Reset
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

/**
 * Type in a field, then click **Navigate Away** to see the confirmation modal.
 * Choose "Discard" to navigate or "Keep editing" to stay on the form.
 */
export const Default: StoryFn = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <FormPage /> },
          { path: 'other', element: <OtherPage /> },
        ],
      },
    ],
    { initialEntries: ['/'] }
  );

  return <RouterProvider router={router} />;
};
