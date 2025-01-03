import { Button } from '@ttoss/ui';
import * as React from 'react';

import { Form, useForm, yup, yupResolver } from '../';
import {
  MultistepFlowMessage,
  MultistepFlowMessageProps,
} from './MultistepFlowMessage';
import { MultistepQuestion } from './MultistepQuestion';

export type MultistepFormStepperProps = {
  flowMessage: MultistepFlowMessageProps;
  onSubmit: (data: unknown) => void;
  question: string;
  isLastStep: boolean;
  fields: React.ReactNode | React.ReactNode[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: yup.ObjectSchema<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues?: any;
  submitLabel: string;
  stepNumber: number;
  // isCurrentStep: boolean;
};

export const MultistepFormStepper = ({
  flowMessage,
  fields,
  onSubmit,
  question,
  submitLabel,
  schema,
  isLastStep,
  defaultValues,
  stepNumber,
  // isCurrentStep,
}: MultistepFormStepperProps) => {
  const formMethods = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
  });

  return (
    <Form
      {...formMethods}
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
      onSubmit={onSubmit}
    >
      <MultistepFlowMessage {...flowMessage} />

      <MultistepQuestion fields={fields} question={question} />

      <Button
        sx={{
          justifyContent: 'center',
          marginTop: '6',
          marginBottom: '4',
          marginX: '6',
        }}
        rightIcon={isLastStep ? undefined : 'nav-right'}
        aria-label={`btn-step-${stepNumber}`}
        type="submit"
      >
        {submitLabel}
      </Button>
    </Form>
  );
};
