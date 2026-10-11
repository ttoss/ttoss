import { Steps } from '@chakra-ui/react';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Box, Flex } from '@ttoss/ui';
import type * as React from 'react';

import type { WizardLayout, WizardStep, WizardStepStatus } from './types';
import {
  getWizardStepDescriptionSx,
  getWizardStepIndicatorSx,
  getWizardStepListSx,
  getWizardStepSeparatorSx,
  getWizardStepTitleSx,
  WizardStepDescriptionFlexSx,
  WizardStepTextWrapperSx,
  type WizardVariant,
} from './Wizard.styles';

interface WizardStepListProps {
  steps: WizardStep[];
  currentStep: number;
  layout: WizardLayout;
  variant: WizardVariant;
  allowStepClick: boolean;
  getStepStatus: (params: { stepIndex: number }) => WizardStepStatus;
  onStepClick: (params: { stepIndex: number }) => void;
}

const messages = defineMessages({
  stepListLabel: {
    defaultMessage: 'Wizard steps',
    description: 'Wizard: accessible name of the list of steps.',
  },
});

const WizardStepText = ({
  step,
  status,
  variant,
}: {
  step: WizardStep;
  status: WizardStepStatus;
  variant: WizardVariant;
}) => {
  if (!step.title && !step.description) {
    return null;
  }

  return (
    <Box sx={WizardStepTextWrapperSx}>
      {step.title && (
        <Steps.Title css={getWizardStepTitleSx({ status, variant })}>
          {step.title}
        </Steps.Title>
      )}
      {step.description && (
        <Flex sx={WizardStepDescriptionFlexSx}>
          <Steps.Description
            css={getWizardStepDescriptionSx({
              status,
              variant,
            })}
          >
            {step.description}
          </Steps.Description>
        </Flex>
      )}
    </Box>
  );
};

export const WizardStepList = ({
  steps,
  currentStep,
  layout,
  variant,
  allowStepClick,
  getStepStatus,
  onStepClick,
}: WizardStepListProps) => {
  const { intl } = useI18n();
  const isHorizontal = layout === 'top' || layout === 'bottom';
  const orientation = isHorizontal ? 'horizontal' : 'vertical';

  return (
    <Flex
      role="navigation"
      aria-label={intl.formatMessage(messages.stepListLabel)}
      data-variant={variant}
      sx={getWizardStepListSx({ layout, variant })}
    >
      <Steps.Root
        step={currentStep}
        count={steps.length}
        orientation={orientation}
      >
        <Steps.List>
          {steps.map((step, index) => {
            const status = getStepStatus({ stepIndex: index });
            const isClickable =
              allowStepClick && status === 'completed' && index !== currentStep;

            return (
              <Steps.Item key={index} index={index}>
                <Flex
                  sx={{
                    flexDirection: isHorizontal ? 'column' : 'row',
                    alignItems: 'center',
                    gap: '2',
                  }}
                >
                  <Box
                    role="button"
                    tabIndex={isClickable ? 0 : -1}
                    onClick={() => {
                      if (isClickable) {
                        onStepClick({ stepIndex: index });
                      }
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onStepClick({ stepIndex: index });
                      }
                    }}
                    aria-current={status === 'active' ? 'step' : undefined}
                    sx={{
                      cursor: isClickable ? 'pointer' : 'default',
                    }}
                  >
                    <Steps.Indicator
                      css={getWizardStepIndicatorSx({
                        status,
                        variant,
                        isClickable,
                      })}
                    >
                      <Steps.Status
                        complete="✓"
                        incomplete={<Steps.Number />}
                      />
                    </Steps.Indicator>
                  </Box>
                  <WizardStepText
                    step={step}
                    status={status}
                    variant={variant}
                  />
                </Flex>
                {index < steps.length - 1 && (
                  <Steps.Separator
                    css={getWizardStepSeparatorSx({
                      isCompleted: index < currentStep,
                      variant,
                    })}
                  />
                )}
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    </Flex>
  );
};
