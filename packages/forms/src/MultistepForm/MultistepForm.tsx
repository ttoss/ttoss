import { Flex } from '@ttoss/ui';
import * as React from 'react';

import { MultistepFlowMessageProps } from './MultistepFlowMessage';
import { MultistepFooter } from './MultistepFooter';
import {
  MultistepFormStepper,
  type MultistepFormStepperProps,
} from './MultistepFormStepper';
import { MultistepHeader, type MultistepHeaderProps } from './MultistepHeader';
import { MultistepNavigation } from './MultistepNavigation';

export type MultistepStep = {
  question: string;
  flowMessage: MultistepFlowMessageProps;
  label: string;
  fields: React.ReactNode | React.ReactNode[];
  schema?: MultistepFormStepperProps['schema'];
  defaultValues?: MultistepFormStepperProps['defaultValues'];
};

export type MultistepFormProps<FormValues = unknown> = {
  header: MultistepHeaderProps;
  steps: MultistepStep[];
  footer?: string;
  onSubmit: (data: FormValues) => void;
  nextStepButtonLabel?: string;
  submitButtonLabel?: string;
};

export const MultistepForm = ({
  nextStepButtonLabel = 'Next',
  submitButtonLabel = 'Send',
  ...props
}: MultistepFormProps) => {
  const amountOfSteps = props.steps.length;

  const [currentStep, setCurrentStep] = React.useState(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = React.useState<any>({});

  const nextStep = () => {
    if (currentStep < amountOfSteps) {
      setCurrentStep((step) => {
        return step + 1;
      });
    }
  };

  const backStep = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => {
        return step - 1;
      });
    }
  };

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        maxWidth: '390px',
        background: '#fff',
      }}
    >
      <MultistepHeader {...props.header} />
      {props.steps.map((step, stepIndex) => {
        const isLastStep = stepIndex + 1 === amountOfSteps;
        const isCurrentStep = stepIndex + 1 === currentStep;

        return (
          <Flex
            sx={{
              flexDirection: 'column',
              display: isCurrentStep ? 'flex' : 'none',
            }}
            key={`form-step-${step.question}`}
            aria-hidden={!isCurrentStep}
          >
            <MultistepFormStepper
              {...step}
              stepNumber={stepIndex + 1}
              isLastStep={isLastStep}
              // isCurrentStep={isCurrentStep}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSubmit={(data: any) => {
                const newValue = { ...form, ...data };

                setForm(newValue);

                if (isLastStep) {
                  props.onSubmit(newValue);
                } else {
                  nextStep();
                }
              }}
              submitLabel={isLastStep ? submitButtonLabel : nextStepButtonLabel}
            />
          </Flex>
        );
      })}

      {currentStep > 1 && (
        <MultistepNavigation
          amountOfSteps={amountOfSteps}
          currentStepNumber={currentStep}
          onBack={backStep}
          stepsLabel={props.steps.map((s) => {
            return s.label;
          })}
        />
      )}

      {props.footer && <MultistepFooter footer={props.footer} />}
    </Flex>
  );
};
