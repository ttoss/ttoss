import { Button } from '@ttoss/ui';
import type * as React from 'react';

import type { yup } from '../';
import { Form, useForm, yupResolver } from '../';
import type { MultistepFlowMessageProps } from './MultistepFlowMessage';
import { MultistepFlowMessage } from './MultistepFlowMessage';
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

  // Built outside JSX: an automation hook keyed on the step index, not
  // user-facing copy.
  const stepButtonHandle = `btn-step-${stepNumber}`;

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
        aria-label={stepButtonHandle}
        type="submit"
      >
        {submitLabel}
      </Button>
    </Form>
  );
};
