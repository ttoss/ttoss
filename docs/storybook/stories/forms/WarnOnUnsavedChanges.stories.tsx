import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Form, FormFieldInput, useForm } from '@ttoss/forms';
import { I18nProvider } from '@ttoss/react-i18n';
import { Button, Flex, Text } from '@ttoss/ui';
import type * as React from 'react';
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

Type in any field below, then try refreshing the page to see the browser prompt.
In a real app with React Router, navigating to another route would show the themed modal.`,
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

/**
 * Type in a field and try refreshing the browser tab to see
 * the native `beforeunload` prompt. In a React Router app,
 * navigating to another route would show a themed confirmation modal.
 */
export const Default: StoryFn = () => {
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
          Form is {isDirty ? 'dirty — navigation would be blocked' : 'clean'}
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
        </Flex>
      </Flex>
    </Form>
  );
};
