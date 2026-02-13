import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useWizard, Wizard } from '@ttoss/react-wizard';
import { Box, Flex, Heading, Input, Label, Text } from '@ttoss/ui';

const meta: Meta<typeof Wizard> = {
  title: 'React Wizard/Wizard',
  component: Wizard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A wizard component for guiding users through multi-step flows. Supports four layout variants (top, right, bottom, left), built-in navigation with step validation, and a `useWizard` hook for accessing wizard state from within step content.',
      },
    },
  },
  argTypes: {
    layout: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Position of the step list relative to the content.',
    },
    allowStepClick: {
      control: 'boolean',
      description: 'Allow clicking on completed steps to navigate back.',
    },
    initialStep: {
      control: 'number',
      description: 'The initially active step index.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wizard>;

const StepInfo = () => {
  const { currentStep, totalSteps } = useWizard();

  return (
    <Text sx={{ fontSize: 0, color: 'textMuted' }}>
      Step {currentStep + 1} of {totalSteps}
    </Text>
  );
};

const basicSteps = [
  {
    title: 'Personal Info',
    description: 'Enter your details',
    content: (
      <Box>
        <Heading as="h3" sx={{ marginBottom: '3' }}>
          Personal Information
        </Heading>
        <StepInfo />
        <Flex sx={{ flexDirection: 'column', gap: '3', marginTop: '3' }}>
          <Label>
            Full Name
            <Input placeholder="John Doe" />
          </Label>
          <Label>
            Email
            <Input placeholder="john@example.com" type="email" />
          </Label>
        </Flex>
      </Box>
    ),
  },
  {
    title: 'Address',
    description: 'Where do you live?',
    content: (
      <Box>
        <Heading as="h3" sx={{ marginBottom: '3' }}>
          Address
        </Heading>
        <StepInfo />
        <Flex sx={{ flexDirection: 'column', gap: '3', marginTop: '3' }}>
          <Label>
            Street
            <Input placeholder="123 Main St" />
          </Label>
          <Label>
            City
            <Input placeholder="Springfield" />
          </Label>
        </Flex>
      </Box>
    ),
  },
  {
    title: 'Review',
    description: 'Confirm your data',
    content: (
      <Box>
        <Heading as="h3" sx={{ marginBottom: '3' }}>
          Review & Confirm
        </Heading>
        <StepInfo />
        <Text sx={{ marginTop: '3' }}>
          Please review your information before submitting.
        </Text>
      </Box>
    ),
  },
];

/**
 * Default wizard with step list on top (horizontal).
 */
export const Top: Story = {
  args: {
    steps: basicSteps,
    layout: 'top',
    onComplete: () => {
      alert('Wizard completed!');
    },
    onCancel: () => {
      alert('Wizard cancelled!');
    },
  },
};

/**
 * Wizard with step list on the left side (vertical).
 */
export const Left: Story = {
  args: {
    steps: basicSteps,
    layout: 'left',
    onComplete: () => {
      alert('Wizard completed!');
    },
    onCancel: () => {
      alert('Wizard cancelled!');
    },
  },
};

/**
 * Wizard with step list on the right side (vertical).
 */
export const Right: Story = {
  args: {
    steps: basicSteps,
    layout: 'right',
    onComplete: () => {
      alert('Wizard completed!');
    },
    onCancel: () => {
      alert('Wizard cancelled!');
    },
  },
};

/**
 * Wizard with step list at the bottom (horizontal).
 */
export const Bottom: Story = {
  args: {
    steps: basicSteps,
    layout: 'bottom',
    onComplete: () => {
      alert('Wizard completed!');
    },
    onCancel: () => {
      alert('Wizard cancelled!');
    },
  },
};

/**
 * Wizard with step validation. The first step's `onNext` always returns false,
 * preventing the user from advancing.
 */
export const WithValidation: Story = {
  args: {
    steps: [
      {
        title: 'Validate Me',
        description: 'Cannot proceed',
        content: (
          <Box>
            <Heading as="h3" sx={{ marginBottom: '3' }}>
              This step blocks navigation
            </Heading>
            <Text>
              The <code>onNext</code> callback returns <code>false</code>,
              preventing the wizard from advancing.
            </Text>
          </Box>
        ),
        onNext: () => {
          alert('Validation failed! Cannot proceed.');
          return false;
        },
      },
      {
        title: 'Unreachable',
        content: <Text>You should not see this step.</Text>,
      },
    ],
    layout: 'top',
  },
};

/**
 * Wizard without a Cancel button (no `onCancel` prop provided).
 */
export const WithoutCancel: Story = {
  args: {
    steps: basicSteps,
    layout: 'top',
    onComplete: () => {
      alert('Wizard completed!');
    },
  },
};

/**
 * Wizard starting at step 2 using `initialStep`.
 */
export const InitialStep: Story = {
  args: {
    steps: basicSteps,
    layout: 'top',
    initialStep: 1,
    onComplete: () => {
      alert('Wizard completed!');
    },
  },
};

/**
 * Wizard with step click navigation disabled.
 * Users cannot click on completed steps to go back.
 */
export const NoStepClick: Story = {
  args: {
    steps: basicSteps,
    layout: 'left',
    allowStepClick: false,
    onComplete: () => {
      alert('Wizard completed!');
    },
    onCancel: () => {
      alert('Wizard cancelled!');
    },
  },
};
