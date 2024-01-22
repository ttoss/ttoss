import * as React from 'react';
import { Button, Flex } from '@ttoss/ui';
import { Form, useForm } from '@ttoss/forms';
import {
  FormSequenceFlowMessage,
  FormSequenceFlowMessageProps,
} from './FormSequenceFlowMessage';
import { FormSequenceFooter } from './FormSequenceFooter';
import { FormSequenceFormFieldsProps } from './FormSequenceFormFields';
import {
  FormSequenceHeader,
  FormSequenceHeaderProps,
} from './FormSequenceHeader';
import { FormSequenceNavigation } from './FormSequenceNavigation';
import { FormSequenceQuestion } from './FormSequenceQuestion';
import { useDebounce } from '@ttoss/react-hooks';

export type FormSequenceProps = {
  header: FormSequenceHeaderProps;
  steps: {
    question: string;
    flowMessage: FormSequenceFlowMessageProps;
    fields: FormSequenceFormFieldsProps[];
  }[];
};

export const FormSequence = ({ header, steps = [] }: FormSequenceProps) => {
  const amountOfSteps = steps.length;
  const [currentStep, setCurrentStep] = React.useState(1);

  const isLastStep = useDebounce(currentStep === amountOfSteps);

  const formMethods = useForm();

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
      <FormSequenceHeader {...header} />

      <Form
        {...formMethods}
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
        onSubmit={(data: unknown) => {
          alert(JSON.stringify(data));
        }}
      >
        {steps.map((step, stepIndex) => {
          return (
            <Flex
              key={`form-step-${step.question}`}
              sx={{
                flexDirection: 'column',
                display: stepIndex + 1 === currentStep ? 'flex' : 'none',
              }}
            >
              <FormSequenceFlowMessage {...step.flowMessage} />

              <FormSequenceQuestion
                fields={step.fields}
                question={step.question}
              />
            </Flex>
          );
        })}

        <Button
          sx={{
            justifyContent: 'center',
            marginTop: '2xl',
            marginBottom: 'xl',
            marginX: '2xl',
          }}
          rightIcon="nav-right"
          onClick={nextStep}
          type={isLastStep ? 'submit' : 'button'}
        >
          Continuar
        </Button>
      </Form>

      {currentStep > 1 && (
        <FormSequenceNavigation
          amountOfSteps={steps.length}
          currentStepNumber={currentStep}
          onBack={backStep}
        />
      )}

      <FormSequenceFooter />
    </Flex>
  );
};
