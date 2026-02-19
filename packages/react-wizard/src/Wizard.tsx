import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex } from '@ttoss/ui';
import * as React from 'react';

import type { WizardLayout, WizardProps, WizardStepStatus } from './types';
import { WizardContext } from './WizardContext';
import { WizardStepList } from './WizardStepList';

const messages = defineMessages({
  previous: {
    defaultMessage: 'Previous',
    description: 'Label for the previous step button in the wizard.',
  },
  next: {
    defaultMessage: 'Next',
    description: 'Label for the next step button in the wizard.',
  },
  finish: {
    defaultMessage: 'Finish',
    description: 'Label for the finish button on the last wizard step.',
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Label for the cancel button in the wizard.',
  },
});

const getFlexDirection = (layout: WizardLayout) => {
  switch (layout) {
    case 'top':
      return 'column' as const;
    case 'bottom':
      return 'column-reverse' as const;
    case 'left':
      return 'row' as const;
    case 'right':
      return 'row-reverse' as const;
  }
};

export const Wizard = ({
  steps,
  layout = 'top',
  onComplete,
  onCancel,
  onStepChange,
  initialStep = 0,
  allowStepClick = true,
}: WizardProps) => {
  const { intl } = useI18n();
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const stepValidationRef = React.useRef<
    (() => boolean | Promise<boolean>) | null
  >(null);

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const getStepStatus = React.useCallback(
    ({ stepIndex }: { stepIndex: number }): WizardStepStatus => {
      if (stepIndex < currentStep) {
        return 'completed';
      }

      if (stepIndex === currentStep) {
        return 'active';
      }

      return 'upcoming';
    },
    [currentStep]
  );

  const goToNext = React.useCallback(async () => {
    const step = steps[currentStep];

    // Check step validation from setStepValidation first
    if (stepValidationRef.current) {
      const canProceed = await stepValidationRef.current();

      if (!canProceed) {
        return;
      }
    }

    // Then check the step's onNext callback
    if (step.onNext) {
      const canProceed = await step.onNext();

      if (!canProceed) {
        return;
      }
    }

    if (isLastStep) {
      onComplete?.();
    } else {
      const nextStep = currentStep + 1;
      // Clear validation before moving to next step
      stepValidationRef.current = null;
      setCurrentStep(nextStep);
      onStepChange?.({ stepIndex: nextStep });
    }
  }, [currentStep, steps, isLastStep, onComplete, onStepChange]);

  const goToPrevious = React.useCallback(() => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      // Clear validation before moving to previous step
      stepValidationRef.current = null;
      setCurrentStep(prevStep);
      onStepChange?.({ stepIndex: prevStep });
    }
  }, [currentStep, isFirstStep, onStepChange]);

  const goToStep = React.useCallback(
    ({ stepIndex }: { stepIndex: number }) => {
      if (
        stepIndex >= 0 &&
        stepIndex < totalSteps &&
        stepIndex <= currentStep
      ) {
        // Clear validation before moving to the target step
        stepValidationRef.current = null;
        setCurrentStep(stepIndex);
        onStepChange?.({ stepIndex });
      }
    },
    [currentStep, totalSteps, onStepChange]
  );

  const setStepValidation = React.useCallback(
    (validate: () => boolean | Promise<boolean>) => {
      stepValidationRef.current = validate;
    },
    []
  );

  const contextValue = React.useMemo(() => {
    return {
      currentStep,
      totalSteps,
      goToNext,
      goToPrevious,
      goToStep,
      isFirstStep,
      isLastStep,
      getStepStatus,
      setStepValidation,
    };
  }, [
    currentStep,
    totalSteps,
    goToNext,
    goToPrevious,
    goToStep,
    isFirstStep,
    isLastStep,
    getStepStatus,
    setStepValidation,
  ]);

  return (
    <WizardContext.Provider value={contextValue}>
      <Flex
        sx={{
          flexDirection: getFlexDirection(layout),
          width: '100%',
          minHeight: '300px',
          border: '1px solid',
          borderColor: 'display.border.muted.default',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <WizardStepList
          steps={steps}
          currentStep={currentStep}
          layout={layout}
          allowStepClick={allowStepClick}
          getStepStatus={getStepStatus}
          onStepClick={goToStep}
        />

        <Flex
          sx={{
            flexDirection: 'column',
            flex: 1,
            padding: '6',
          }}
        >
          {/* Step content */}
          <Box sx={{ flex: 1, marginBottom: '4' }}>
            {steps[currentStep].content}
          </Box>

          {/* Navigation buttons */}
          <Flex
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '3',
            }}
          >
            <Flex sx={{ gap: '3' }}>
              {onCancel && (
                <Button
                  variant="secondary"
                  onClick={onCancel}
                  aria-label={intl.formatMessage(messages.cancel)}
                >
                  {intl.formatMessage(messages.cancel)}
                </Button>
              )}
            </Flex>

            <Flex sx={{ gap: '3' }}>
              <Button
                variant="secondary"
                onClick={goToPrevious}
                disabled={isFirstStep}
                aria-label={intl.formatMessage(messages.previous)}
              >
                {intl.formatMessage(messages.previous)}
              </Button>
              <Button
                onClick={goToNext}
                aria-label={
                  isLastStep
                    ? intl.formatMessage(messages.finish)
                    : intl.formatMessage(messages.next)
                }
              >
                {isLastStep
                  ? intl.formatMessage(messages.finish)
                  : intl.formatMessage(messages.next)}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </WizardContext.Provider>
  );
};

Wizard.displayName = 'Wizard';
