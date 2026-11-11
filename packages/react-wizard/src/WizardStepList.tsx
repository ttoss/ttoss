import { Steps } from '@chakra-ui/react';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Box, Flex, Text } from '@ttoss/ui';
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

/**
 * Below the `md` breakpoint a horizontal list has no room for every step's
 * text: each item shows only its indicator and the active step's text is
 * rendered once, full width, under the list (`WizardActiveStepSummary`).
 */
const HORIZONTAL_TEXT_DISPLAY = ['none', 'none', 'block'];
const HORIZONTAL_SUMMARY_DISPLAY = ['block', 'block', 'none'];

const WizardStepText = ({
  step,
  status,
  variant,
  isHorizontal,
}: {
  step: WizardStep;
  status: WizardStepStatus;
  variant: WizardVariant;
  isHorizontal: boolean;
}) => {
  if (!step.title && !step.description) {
    return null;
  }

  return (
    <Box
      sx={{
        ...WizardStepTextWrapperSx,
        ...(isHorizontal ? { display: HORIZONTAL_TEXT_DISPLAY } : {}),
      }}
    >
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

const WizardActiveStepSummary = ({
  step,
  variant,
}: {
  step?: WizardStep;
  variant: WizardVariant;
}) => {
  if (!step || (!step.title && !step.description)) {
    return null;
  }

  return (
    <Box
      data-testid="wizard-active-step-summary"
      sx={{
        display: HORIZONTAL_SUMMARY_DISPLAY,
        marginTop: '4',
        textAlign: 'center',
      }}
    >
      {step.title && (
        <Text as="div" sx={getWizardStepTitleSx({ status: 'active', variant })}>
          {step.title}
        </Text>
      )}
      {step.description && (
        <Text
          as="div"
          sx={getWizardStepDescriptionSx({ status: 'active', variant })}
        >
          {step.description}
        </Text>
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
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <Steps.Root
          step={currentStep}
          count={steps.length}
          orientation={orientation}
        >
          <Steps.List>
            {steps.map((step, index) => {
              const status = getStepStatus({ stepIndex: index });
              const isClickable =
                allowStepClick &&
                status === 'completed' &&
                index !== currentStep;

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
                        if (
                          isClickable &&
                          (e.key === 'Enter' || e.key === ' ')
                        ) {
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
                      isHorizontal={isHorizontal}
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
        {isHorizontal && (
          <WizardActiveStepSummary
            step={steps[currentStep]}
            variant={variant}
          />
        )}
      </Box>
    </Flex>
  );
};
