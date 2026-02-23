/* eslint-disable formatjs/no-literal-string-in-jsx */
import { Steps } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Box, Flex } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta<typeof Steps.Root> = {
  title: 'Chakra UI/Steps',
  component: Steps.Root,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Chakra UI Steps component for creating step-by-step flows styled with ttoss semantic color tokens. This is a multi-part component (slot recipe) with customizable indicator, separator, title, and description slots.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Steps.Root>;

const basicSteps = [
  { title: 'Step 1', description: 'First step description' },
  { title: 'Step 2', description: 'Second step description' },
  { title: 'Step 3', description: 'Third step description' },
];

/**
 * Default horizontal steps with the first step active.
 */
export const Default: Story = {
  render: () => {
    return (
      <Steps.Root defaultValue={0}>
        <Steps.List>
          {basicSteps.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    );
  },
};

/**
 * Steps with second step active (in progress).
 */
export const SecondStepActive: Story = {
  render: () => {
    return (
      <Steps.Root defaultValue={1}>
        <Steps.List>
          {basicSteps.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    );
  },
};

/**
 * All steps completed.
 */
export const AllCompleted: Story = {
  render: () => {
    return (
      <Steps.Root defaultValue={3}>
        <Steps.List>
          {basicSteps.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
        <Box sx={{ mt: 4, p: 4, border: 'md', borderRadius: 'md' }}>
          <p>✅ All steps completed!</p>
        </Box>
      </Steps.Root>
    );
  },
};

/**
 * Vertical orientation for narrow layouts or sidebars.
 */
export const Vertical: Story = {
  render: () => {
    return (
      <Steps.Root defaultValue={1} orientation="vertical">
        <Steps.List>
          {basicSteps.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    );
  },
};

/**
 * Steps without descriptions for a more compact layout.
 */
export const WithoutDescriptions: Story = {
  render: () => {
    return (
      <Steps.Root defaultValue={1}>
        <Steps.List>
          {['Account', 'Profile', 'Payment', 'Confirmation'].map(
            (step, index) => {
              return (
                <Steps.Item key={index} index={index}>
                  <Steps.Trigger>
                    <Steps.Indicator>
                      <Steps.Number />
                    </Steps.Indicator>
                    <Steps.Content index={index}>
                      <Steps.Title>{step}</Steps.Title>
                    </Steps.Content>
                  </Steps.Trigger>
                  <Steps.Separator />
                </Steps.Item>
              );
            }
          )}
        </Steps.List>
      </Steps.Root>
    );
  },
};

const RenderInteractiveSteps = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const steps = [
    {
      title: 'Create Account',
      description: 'Enter your email and password',
    },
    { title: 'Verify Email', description: 'Check your inbox for the code' },
    { title: 'Complete Profile', description: 'Add your personal details' },
    { title: 'Get Started', description: 'Begin using the application' },
  ];

  return (
    <Box>
      <Steps.Root defaultValue={currentStep} key={currentStep}>
        <Steps.List>
          {steps.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
      <Flex sx={{ gap: '4', mt: '8' }}>
        <button
          onClick={() => {
            return setCurrentStep(Math.max(0, currentStep - 1));
          }}
          disabled={currentStep === 0}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: currentStep === 0 ? '#f5f5f5' : '#fff',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <button
          onClick={() => {
            return setCurrentStep(Math.min(steps.length, currentStep + 1));
          }}
          disabled={currentStep === steps.length}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: currentStep === steps.length ? '#f5f5f5' : '#007acc',
            color: currentStep === steps.length ? '#666' : '#fff',
            cursor: currentStep === steps.length ? 'not-allowed' : 'pointer',
          }}
        >
          {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </Flex>
    </Box>
  );
};

/**
 * Interactive steps with navigation controls.
 */
export const Interactive: Story = {
  render: RenderInteractiveSteps,
};

/**
 * Many steps to demonstrate scrolling behavior.
 */
export const ManySteps: Story = {
  render: () => {
    const manySteps = Array.from({ length: 8 }, (_, i) => {
      return {
        title: `Step ${i + 1}`,
        description: `Description for step ${i + 1}`,
      };
    });

    return (
      <Steps.Root defaultValue={3}>
        <Steps.List>
          {manySteps.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    );
  },
};

/**
 * Custom step indicators with icons instead of numbers.
 */
export const WithIcons: Story = {
  render: () => {
    const stepsWithIcons = [
      { title: 'Account', description: 'Create your account', icon: '👤' },
      { title: 'Profile', description: 'Setup your profile', icon: '📝' },
      { title: 'Payment', description: 'Add payment method', icon: '💳' },
      { title: 'Done', description: 'All set!', icon: '✅' },
    ];

    return (
      <Steps.Root defaultValue={1}>
        <Steps.List>
          {stepsWithIcons.map((step, index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <span>{step.icon}</span>
                  </Steps.Indicator>
                  <Steps.Content index={index}>
                    <Steps.Title>{step.title}</Steps.Title>
                    <Steps.Description>{step.description}</Steps.Description>
                  </Steps.Content>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    );
  },
};

/**
 * Minimal steps with only indicators and separators.
 */
export const Minimal: Story = {
  render: () => {
    return (
      <Steps.Root defaultValue={2}>
        <Steps.List>
          {[0, 1, 2, 3, 4].map((index) => {
            return (
              <Steps.Item key={index} index={index}>
                <Steps.Trigger>
                  <Steps.Indicator>
                    <Steps.Number />
                  </Steps.Indicator>
                </Steps.Trigger>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    );
  },
};
