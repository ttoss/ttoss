import * as React from 'react';
import { Flex } from '@ttoss/ui';
import { FormSequenceFlowMessage } from './FormSequenceFlowMessage';
import { FormSequenceFormFieldsProps } from './FormSequenceFormFields';
import {
  FormSequenceHeader,
  type FormSequenceHeaderLogoProps,
} from './FormSequenceHeader';
import { FormSequenceNavigation } from './FormSequenceNavigation';
import { FormSequenceQuestion } from './FormSequenceQuestion';

export type FormSequenceProps = {
  header: FormSequenceHeaderLogoProps;
  steps: {
    question: string;
    fields: FormSequenceFormFieldsProps[];
  }[];
};

export const FormSequence = ({ header, steps = [] }: FormSequenceProps) => {
  const amountOfSteps = steps.length;
  const [currentStep, setCurrentStep] = React.useState(1);

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
    <Flex sx={{ flexDirection: 'column', maxWidth: '390px' }}>
      <FormSequenceHeader {...header} />

      {steps.map((step, stepIndex) => {
        return (
          <Flex
            key={`form-step-${step.question}`}
            sx={{
              flexDirection: 'column',
              display: stepIndex + 1 === currentStep ? 'flex' : 'none',
            }}
          >
            <FormSequenceFlowMessage />

            <FormSequenceQuestion
              fields={step.fields}
              question={step.question}
              onNext={nextStep}
            />
          </Flex>
        );
      })}

      <FormSequenceNavigation
        amountOfSteps={steps.length}
        currentStepNumber={1}
        onBack={backStep}
      />
    </Flex>
  );
};
