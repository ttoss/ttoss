import * as React from 'react';
import { Flex } from '@ttoss/ui';
import { Footer } from './Footer';
import { Header, type HeaderProps } from './Header';
import { MultistepFlowMessageProps } from './Multistep/MultistepFlowMessage';
import {
  MultistepFormStepper,
  type MultistepFormStepperProps,
} from './Multistep/MultistepFormStepper';
import { Navigation } from './Navigation';

export type MultistepStep = {
  question: string;
  flowMessage: MultistepFlowMessageProps;
  label: string;
  fields: React.ReactNode | React.ReactNode[];
  schema?: MultistepFormStepperProps['schema'];
  defaultValues?: MultistepFormStepperProps['defaultValues'];
};

export type MultistepFormProps<FormValues = unknown> = {
  header: HeaderProps;
  steps: MultistepStep[];
  footer?: string;
  onSubmit: (data: FormValues) => void;
};

export const MultistepForm = (props: MultistepFormProps) => {
  const amountOfSteps = props.steps.length;
  const [currentStep, setCurrentStep] = React.useState(1);

  const isLastStep = currentStep === amountOfSteps;

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
      <Header {...props.header} />
      {props.steps.map((step, stepIndex) => {
        return (
          <Flex
            sx={{
              flexDirection: 'column',
              display: stepIndex + 1 === currentStep ? 'flex' : 'none',
            }}
            key={`form-step-${step.question}`}
          >
            <MultistepFormStepper
              flowMessage={step.flowMessage}
              isLastStep={isLastStep}
              fields={step.fields}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSubmit={(data: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setForm((prev: any) => {
                  return { ...prev, ...data };
                });
                nextStep();
                props.onSubmit({ ...form, ...data });
              }}
              defaultValues={step.defaultValues}
              schema={step.schema}
              question={step.question}
              submitLabel={isLastStep ? 'Enviar' : 'Continuar'}
            />
          </Flex>
        );
      })}

      {currentStep > 1 && (
        <Navigation
          amountOfSteps={amountOfSteps}
          currentStepNumber={currentStep}
          onBack={backStep}
          stepsLabel={props.steps.map((s) => {
            return s.label;
          })}
        />
      )}

      {props.footer && <Footer footer={props.footer} />}
    </Flex>
  );
};
