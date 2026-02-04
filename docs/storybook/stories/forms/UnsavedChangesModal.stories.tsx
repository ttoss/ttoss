import type { Meta, Story } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldInput,
  UnsavedChangesModal,
  useForm,
  useUnsavedChanges,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Flex, Heading, Text } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/UnsavedChangesModal',
  component: UnsavedChangesModal,
  parameters: {
    docs: {
      description: {
        component:
          'A modal that warns users about unsaved changes before leaving a form. Uses the `useUnsavedChanges` hook to track form dirty state and prevent accidental data loss. The modal is styled using OCA theme tokens for consistency.',
      },
    },
  },
  tags: ['autodocs'],
} as Meta;

/**
 * Basic example showing the modal with unsaved changes protection
 */
export const BasicExample: Story = () => {
  const formMethods = useForm();
  const { showModal, handleDiscard, handleKeepEditing } = useUnsavedChanges();

  const handleDiscardAndReset = () => {
    action('onDiscard')();
    handleDiscard();
    formMethods.reset();
  };

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '500px' }}>
      <Heading as="h2">User Profile Form</Heading>
      <Text>
        Try editing the form fields below, then attempt to leave the page or
        click the &quot;Reset Form&quot; button to see the unsaved changes
        modal.
      </Text>

      <Form {...formMethods} onSubmit={action('onSubmit')}>
        <Flex sx={{ flexDirection: 'column', gap: '3' }}>
          <FormFieldInput
            name="firstName"
            label="First Name"
            placeholder="Enter your first name"
          />

          <FormFieldInput
            name="lastName"
            label="Last Name"
            placeholder="Enter your last name"
          />

          <FormFieldInput
            name="email"
            label="Email"
            placeholder="your.email@example.com"
          />

          <FormFieldInput
            name="phone"
            label="Phone"
            placeholder="+1 (555) 123-4567"
          />

          <Flex sx={{ gap: '2', marginTop: '2' }}>
            <Button type="submit" variant="accent">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (formMethods.formState.isDirty) {
                  // Show modal before resetting
                  handleKeepEditing();
                  // In this demo, we'll just reset
                  formMethods.reset();
                } else {
                  formMethods.reset();
                }
              }}
            >
              Reset Form
            </Button>
          </Flex>
        </Flex>
      </Form>

      <UnsavedChangesModal
        isOpen={showModal}
        onDiscard={handleDiscardAndReset}
        onKeepEditing={handleKeepEditing}
      />

      <Text sx={{ fontSize: '1', color: 'display.text.muted.default' }}>
        💡 Tip: The modal will also appear if you try to close the browser tab
        or navigate away while the form has unsaved changes.
      </Text>
    </Flex>
  );
};

BasicExample.parameters = {
  docs: {
    description: {
      story:
        'Basic usage showing unsaved changes protection in a form. Edit any field and try to leave or reset to see the modal.',
    },
  },
};

/**
 * Example with custom title and message
 */
export const CustomMessages: Story = () => {
  const formMethods = useForm();
  const { showModal, handleDiscard, handleKeepEditing } = useUnsavedChanges();

  const handleDiscardAndReset = () => {
    action('onDiscard')();
    handleDiscard();
    formMethods.reset();
  };

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '500px' }}>
      <Heading as="h2">Survey Form</Heading>
      <Text>
        This example uses custom title and message for the unsaved changes
        modal.
      </Text>

      <Form {...formMethods} onSubmit={action('onSubmit')}>
        <Flex sx={{ flexDirection: 'column', gap: '3' }}>
          <FormFieldInput
            name="feedback"
            label="Your Feedback"
            placeholder="Tell us what you think..."
          />

          <FormFieldInput
            name="rating"
            label="Rating (1-10)"
            placeholder="Enter a number from 1 to 10"
          />

          <Button type="submit" variant="accent" sx={{ marginTop: '2' }}>
            Submit Survey
          </Button>
        </Flex>
      </Form>

      <UnsavedChangesModal
        isOpen={showModal}
        onDiscard={handleDiscardAndReset}
        onKeepEditing={handleKeepEditing}
        title="Wait! Your feedback matters!"
        message="Are you sure you want to discard your feedback? We'd love to hear what you have to say."
      />
    </Flex>
  );
};

CustomMessages.parameters = {
  docs: {
    description: {
      story:
        'Example showing custom title and message for the unsaved changes modal.',
    },
  },
};

/**
 * Example with validation
 */
export const WithValidation: Story = () => {
  const schema = yup.object({
    username: yup
      .string()
      .required('Username is required')
      .min(3, 'Username must be at least 3 characters'),
    email: yup
      .string()
      .required('Email is required')
      .email('Must be a valid email'),
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters'),
  });

  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  const { showModal, handleDiscard, handleKeepEditing } = useUnsavedChanges();

  const handleDiscardAndReset = () => {
    action('onDiscard')();
    handleDiscard();
    formMethods.reset();
  };

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '500px' }}>
      <Heading as="h2">Registration Form</Heading>
      <Text>
        This form includes validation. Start filling it out to see the unsaved
        changes protection in action.
      </Text>

      <Form {...formMethods} onSubmit={action('onSubmit')}>
        <Flex sx={{ flexDirection: 'column', gap: '3' }}>
          <FormFieldInput name="username" label="Username" />

          <FormFieldInput name="email" label="Email" />

          <FormFieldInput name="password" label="Password" type="password" />

          <Flex sx={{ gap: '2', marginTop: '2' }}>
            <Button type="submit" variant="accent">
              Register
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (formMethods.formState.isDirty) {
                  // In a real app, you'd trigger handleAttemptNavigation here
                  formMethods.reset();
                } else {
                  formMethods.reset();
                }
              }}
            >
              Clear Form
            </Button>
          </Flex>
        </Flex>
      </Form>

      <UnsavedChangesModal
        isOpen={showModal}
        onDiscard={handleDiscardAndReset}
        onKeepEditing={handleKeepEditing}
      />
    </Flex>
  );
};

WithValidation.parameters = {
  docs: {
    description: {
      story:
        'Example showing unsaved changes protection with form validation. The modal works seamlessly with validation rules.',
    },
  },
};

/**
 * Manual modal trigger example
 */
export const ManualTrigger: Story = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleDiscard = () => {
    action('Discarded changes')();
    setIsModalOpen(false);
  };

  const handleKeepEditing = () => {
    action('Continued editing')();
    setIsModalOpen(false);
  };

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '500px' }}>
      <Heading as="h2">Manual Modal Control</Heading>
      <Text>
        This example demonstrates manual control of the modal without the hook.
        Click the button to open the modal directly.
      </Text>

      <Button
        onClick={() => {
          setIsModalOpen(true);
        }}
        variant="primary"
      >
        Open Modal
      </Button>

      <UnsavedChangesModal
        isOpen={isModalOpen}
        onDiscard={handleDiscard}
        onKeepEditing={handleKeepEditing}
      />
    </Flex>
  );
};

ManualTrigger.parameters = {
  docs: {
    description: {
      story:
        'Example showing manual control of the modal. Useful when you want to trigger the modal from custom logic.',
    },
  },
};
