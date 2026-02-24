import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldInput,
  FormFieldRadioCard,
  FormFieldSegmentedControl,
  UnsavedChangesModal,
  useForm,
  useFormContext,
  useUnsavedChanges,
  z,
  zodResolver,
} from '@ttoss/forms';
import { Button, Flex, Heading, Text } from '@ttoss/ui';
import * as React from 'react';
import { action } from 'storybook/actions';

const meta: Meta<typeof UnsavedChangesModal> = {
  title: 'Forms/UnsavedChangesModal',
  component: UnsavedChangesModal,
  parameters: {
    docs: {
      description: {
        component:
          'Navigation guard modal for unsaved form changes. Mark fields with `unsavedChangesGuard` and use `useUnsavedChanges` to block route changes until user confirms discard.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UnsavedChangesModal>;

const GuardedFormContent = ({
  onNavigate,
  title,
  message,
}: {
  onNavigate: () => void;
  title?: string;
  message?: string;
}) => {
  const formMethods = useFormContext();
  const {
    showModal,
    isDirty,
    handleDiscard,
    handleKeepEditing,
    createNavigationHandler,
  } = useUnsavedChanges();

  const handleDiscardAndNavigate = React.useCallback(() => {
    formMethods.reset();
    handleDiscard();
  }, [formMethods, handleDiscard]);

  const goToNextPage = React.useMemo(() => {
    return createNavigationHandler({
      onProceed: onNavigate,
    });
  }, [createNavigationHandler, onNavigate]);

  return (
    <>
      <Flex sx={{ flexDirection: 'column', gap: '3' }}>
        <FormFieldInput
          name="firstName"
          label="First Name"
          placeholder="Enter your first name"
          unsavedChangesGuard={true}
        />

        <FormFieldInput
          name="email"
          label="Email"
          placeholder="your.email@example.com"
          unsavedChangesGuard={true}
        />

        <FormFieldInput
          name="notes"
          label="Notes (not guarded)"
          placeholder="This field alone does not block navigation"
        />

        <Text sx={{ fontSize: '1', color: 'display.text.muted.default' }}>
          Dirty state: {isDirty ? 'Yes' : 'No'}
        </Text>

        <Flex sx={{ gap: '2', marginTop: '2' }}>
          <Button
            type="submit"
            variant="accent"
            onClick={() => {
              action('saved')();
            }}
          >
            Save Changes
          </Button>

          <Button type="button" variant="secondary" onClick={goToNextPage}>
            Navigate to Dashboard
          </Button>
        </Flex>
      </Flex>

      <UnsavedChangesModal
        isOpen={showModal}
        onDiscard={handleDiscardAndNavigate}
        onKeepEditing={handleKeepEditing}
        title={title}
        message={message}
      />
    </>
  );
};

const NavigationDemo = ({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) => {
  const [page, setPage] = React.useState<'form' | 'dashboard'>('form');
  const formMethods = useForm({
    defaultValues: {
      firstName: '',
      email: '',
      notes: '',
    },
  });

  if (page === 'dashboard') {
    return (
      <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '560px' }}>
        <Heading as="h2">Dashboard Page</Heading>
        <Text>You navigated only after confirming discard or saving.</Text>
        <Button
          variant="secondary"
          onClick={() => {
            setPage('form');
          }}
        >
          Back to Form
        </Button>
      </Flex>
    );
  }

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '560px' }}>
      <Heading as="h2">Profile Form</Heading>
      <Text>
        Edit the guarded fields, then try to navigate. The modal blocks
        navigation until you choose to discard or keep editing.
      </Text>

      <Form
        {...formMethods}
        onSubmit={(data) => {
          action('onSubmit')(data);
          formMethods.reset(data);
        }}
      >
        <GuardedFormContent
          onNavigate={() => {
            setPage('dashboard');
          }}
          title={title}
          message={message}
        />
      </Form>
    </Flex>
  );
};

export const BlocksNavigation: Story = {
  render: () => {
    return <NavigationDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates real page-navigation blocking. Guarded fields prevent route changes until user confirms discard.',
      },
    },
  },
};

export const CustomMessages: Story = {
  render: () => {
    return (
      <NavigationDemo
        title="Wait! You still have unsaved work"
        message="If you leave now, your profile updates will be lost. Do you want to discard them?"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Same navigation-guard flow with custom modal title and message.',
      },
    },
  },
};

const validationSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const ValidationFormContent = () => {
  const formMethods = useFormContext();
  const {
    showModal,
    handleDiscard,
    handleKeepEditing,
    createNavigationHandler,
  } = useUnsavedChanges();

  const handleDiscardAndReset = React.useCallback(() => {
    formMethods.reset();
    handleDiscard();
  }, [formMethods, handleDiscard]);

  const tryLeaveForm = React.useMemo(() => {
    return createNavigationHandler({
      onProceed: () => {
        action('navigated-away')();
      },
    });
  }, [createNavigationHandler]);

  return (
    <>
      <Flex sx={{ flexDirection: 'column', gap: '3' }}>
        <FormFieldInput
          name="username"
          label="Username"
          unsavedChangesGuard={true}
        />
        <FormFieldInput name="email" label="Email" unsavedChangesGuard={true} />
        <FormFieldInput
          name="password"
          label="Password"
          type="password"
          unsavedChangesGuard={true}
        />

        <Flex sx={{ gap: '2', marginTop: '2' }}>
          <Button type="submit" variant="accent">
            Register
          </Button>
          <Button type="button" variant="secondary" onClick={tryLeaveForm}>
            Try Leave Page
          </Button>
        </Flex>
      </Flex>

      <UnsavedChangesModal
        isOpen={showModal}
        onDiscard={handleDiscardAndReset}
        onKeepEditing={handleKeepEditing}
      />
    </>
  );
};

const WithValidationDemo = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '560px' }}>
      <Heading as="h2">Registration Form</Heading>
      <Text>
        Validation and unsaved-changes blocking working together with Zod.
      </Text>

      <Form
        {...formMethods}
        onSubmit={(data) => {
          action('onSubmit')(data);
          formMethods.reset(data);
        }}
      >
        <ValidationFormContent />
      </Form>
    </Flex>
  );
};

const SegmentedFormContent = () => {
  const formMethods = useFormContext();
  const {
    showModal,
    isDirty,
    handleDiscard,
    handleKeepEditing,
    createNavigationHandler,
  } = useUnsavedChanges();

  const handleDiscardAndReset = React.useCallback(() => {
    formMethods.reset();
    handleDiscard();
  }, [formMethods, handleDiscard]);

  const tryLeaveForm = React.useMemo(() => {
    return createNavigationHandler({
      onProceed: () => {
        action('navigated-away')();
      },
    });
  }, [createNavigationHandler]);

  return (
    <>
      <Flex sx={{ flexDirection: 'column', gap: '3' }}>
        <FormFieldRadioCard
          name="plan"
          label="Choose your plan"
          options={[
            {
              value: 'basic',
              label: 'Basic Plan',
              description: 'Good for personal projects and small teams.',
            },
            {
              value: 'pro',
              label: 'Pro Plan',
              description: 'Best for growing teams that need more power.',
            },
            {
              value: 'enterprise',
              label: 'Enterprise Plan',
              description: 'For organizations with advanced requirements.',
            },
          ]}
          unsavedChangesGuard={true}
        />

        <FormFieldSegmentedControl
          name="billing"
          label="Billing frequency"
          options={[
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ]}
          unsavedChangesGuard={true}
        />

        <Text sx={{ fontSize: '1', color: 'display.text.muted.default' }}>
          Dirty state: {isDirty ? 'Yes' : 'No'}
        </Text>

        <Flex sx={{ gap: '2', marginTop: '2' }}>
          <Button type="submit" variant="accent">
            Save Changes
          </Button>

          <Button type="button" variant="secondary" onClick={tryLeaveForm}>
            Try Leave Page
          </Button>
        </Flex>
      </Flex>

      <UnsavedChangesModal
        isOpen={showModal}
        onDiscard={handleDiscardAndReset}
        onKeepEditing={handleKeepEditing}
      />
    </>
  );
};

const WithSegmentedControlAndRadioCardDemo = () => {
  const formMethods = useForm({
    defaultValues: {
      plan: 'basic',
      billing: 'monthly',
    },
  });

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '560px' }}>
      <Heading as="h2">Plan & Billing Form</Heading>
      <Text>
        This example uses{' '}
        <Text as="span" sx={{ fontWeight: 'bold' }}>
          FormFieldRadioCard
        </Text>{' '}
        and{' '}
        <Text as="span" sx={{ fontWeight: 'bold' }}>
          FormFieldSegmentedControl
        </Text>{' '}
        as guarded fields. Update either field and try to leave to see the
        confirmation modal.
      </Text>

      <Form
        {...formMethods}
        onSubmit={(data) => {
          action('onSubmit')(data);
          formMethods.reset(data);
        }}
      >
        <SegmentedFormContent />
      </Form>
    </Flex>
  );
};

const ManualTriggerDemo = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4', maxWidth: '560px' }}>
      <Heading as="h2">Manual Modal Trigger</Heading>
      <Text>
        Manual control, useful when you want to open the modal with custom
        non-form logic.
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
        onDiscard={() => {
          action('Discarded changes')();
          setIsModalOpen(false);
        }}
        onKeepEditing={() => {
          action('Continued editing')();
          setIsModalOpen(false);
        }}
      />
    </Flex>
  );
};

export const WithValidation: Story = {
  render: () => {
    return <WithValidationDemo />;
  },
};

export const WithSegmentedControlAndRadioCard: Story = {
  render: () => {
    return <WithSegmentedControlAndRadioCardDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses guarded choice fields (radio card + segmented control) to demonstrate navigation blocking and discard confirmation.',
      },
    },
  },
};

export const ManualTrigger: Story = {
  render: () => {
    return <ManualTriggerDemo />;
  },
};
