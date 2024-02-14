import * as React from 'react';
import { Flex } from '@ttoss/ui';
// import { Form, useForm } from '@ttoss/forms';
// import {
//   MultistepFlowMessage,
//   MultistepFlowMessageProps,
// } from './Multistep/MultistepFlowMessage';
import { Footer } from './Footer';
// import { MultistepFormFieldsProps } from './MultistepFormFields';
import { Header, type HeaderProps } from './Header';
import { Navigation } from './Navigation';
// import { MultistepQuestion } from './MultistepQuestion';
// import { useDebounce } from '@ttoss/react-hooks';

// export type MultistepStep = {
//   question: string;
//   // flowMessage: MultistepFlowMessageProps;
//   label: string;
//   fields: MultistepFormFieldsProps[];
// };

export type MultistepFormProps<FormValues = unknown> = {
  header: HeaderProps;
  // steps: MultistepStep[];
  footer?: string;
  onSubmit: (data: FormValues) => void;
};

export const MultistepForm = (props: MultistepFormProps) => {
  // const amountOfSteps = steps.length;
  const [currentStep, setCurrentStep] = React.useState(1);

  // const isLastStep = useDebounce(currentStep === amountOfSteps);

  // const formMethods = useForm();

  // const nextStep = () => {
  //   if (currentStep < amountOfSteps) {
  //     setCurrentStep((step) => {
  //       return step + 1;
  //     });
  //   }
  // };

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

      {/* <Form
        {...formMethods}
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
        onSubmit={onSubmit}
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
              <MultistepFlowMessage {...step.flowMessage} />

              <MultistepQuestion
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
      </Form> */}

      {currentStep > 1 && (
        <Navigation
          amountOfSteps={2}
          currentStepNumber={currentStep}
          onBack={backStep}
          stepsLabel={[]}
        />
      )}

      {props.footer && <Footer footer={props.footer} />}
    </Flex>
  );
};
