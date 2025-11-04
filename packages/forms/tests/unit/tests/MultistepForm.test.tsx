import { render, screen, userEvent } from '@ttoss/test-utils/react';

import { FormFieldInput, yup } from '../../../src';
import {
  MultistepForm,
  type MultistepFormProps,
} from '../../../src/MultistepForm';

const HEADERS = {
  titled: {
    variant: 'titled' as const,
    title: 'title',
    leftIcon: 'arrowLeft',
    rightIcon: 'arrowRight',
    onLeftIconClick: jest.fn(),
    onRightIconClick: jest.fn(),
  },
  logo: {
    variant: 'logo' as const,
    src: 'https://placehold.co/115',
    onClose: jest.fn(),
  },
};

test('should render titled header', () => {
  const props: MultistepFormProps = {
    header: HEADERS.titled,
    onSubmit: jest.fn(),
    steps: [],
  };
  render(<MultistepForm {...props} />);
  expect(screen.getByText('title')).toBeInTheDocument();
});

test('should render logo header', () => {
  const src = 'https://placehold.co/115';
  const props: MultistepFormProps = {
    header: HEADERS.logo,
    onSubmit: jest.fn(),
    steps: [],
  };
  render(<MultistepForm {...props} />);
  const img = screen.getByRole('img');
  expect(img).toBeInTheDocument();
  expect(img).toHaveAttribute('src', src);
});

test('should render footer', () => {
  const props: MultistepFormProps = {
    header: HEADERS.logo,
    onSubmit: jest.fn(),
    steps: [],
    footer: 'footer',
  };
  render(<MultistepForm {...props} />);
  expect(screen.getByText('footer')).toBeInTheDocument();
});

test('should show message error on try to go to the next step without fill out a required field', async () => {
  const requiredFieldMessage = 'Step 1 is a required field';

  const STEPS: MultistepFormProps['steps'] = [
    {
      question: 'question 1',
      label: 'label 1',
      flowMessage: {
        variant: 'image-text',
        src: 'https://placehold.co/200',
        description: 'Flow message 1',
      },
      schema: yup.object({
        step1: yup.string().required(requiredFieldMessage),
      }),
      fields: <FormFieldInput name="step1" label="Step 1" />,
    },
    {
      question: 'question 2',
      label: 'label 2',
      flowMessage: {
        variant: 'image-text',
        src: 'https://placehold.co/200',
        description: 'Flow message 2',
      },
      fields: <FormFieldInput name="step2" label="Step 2" />,
    },
    {
      question: 'question 3',
      label: 'label 3',
      flowMessage: {
        variant: 'image-text',
        src: 'https://placehold.co/200',
        description: 'Flow message 3',
      },
      fields: <FormFieldInput name="step3" label="Step 3" />,
    },
  ];

  const props: MultistepFormProps = {
    header: HEADERS.logo,
    footer: 'footer',
    onSubmit: jest.fn(),
    steps: STEPS,
  };

  render(<MultistepForm {...props} />);

  const user = userEvent.setup({ delay: null });

  const nextStepButton = screen.getByLabelText(`btn-step-1`);
  await user.click(nextStepButton);

  expect(await screen.findByText(requiredFieldMessage)).toBeInTheDocument();
});

test('should render all steps and submit the form on last step', async () => {
  const STEPS: MultistepFormProps['steps'] = [
    {
      question: 'question 1',
      label: 'label 1',
      flowMessage: {
        variant: 'image-text',
        src: 'https://placehold.co/200',
        description: 'Flow message 1',
      },
      defaultValues: {
        step1: 'value to step 1',
      },
      fields: <FormFieldInput name="step1" label="Step 1" />,
    },
    {
      question: 'question 2',
      label: 'label 2',
      flowMessage: {
        variant: 'image-text',
        src: 'https://placehold.co/200',
        description: 'Flow message 2',
      },
      defaultValues: {
        step2: 'value to step 2',
      },
      fields: <FormFieldInput name="step2" label="Step 2" />,
    },
    {
      question: 'question 3',
      label: 'label 3',
      flowMessage: {
        variant: 'image-text',
        src: 'https://placehold.co/200',
        description: 'Flow message 3',
      },
      defaultValues: {
        step3: 'value to step 3',
      },
      fields: <FormFieldInput name="step3" label="Step 3" />,
    },
  ];

  const props: MultistepFormProps = {
    header: HEADERS.logo,
    footer: 'footer',
    onSubmit: jest.fn(),
    steps: STEPS,
  };

  render(<MultistepForm {...props} />);

  const user = userEvent.setup({ delay: null });

  for (let idx = 0; idx < STEPS.length; idx++) {
    const step = STEPS[idx];

    const description = await screen.findByText(
      step.flowMessage.description as string
    );

    expect(description).toBeInTheDocument();

    const nextStepButton = screen.getByLabelText(`btn-step-${idx + 1}`);

    await user.click(nextStepButton);

    await jest.advanceTimersToNextTimerAsync();

    if (idx < STEPS.length - 1) {
      await screen.findByText(STEPS[idx + 1].flowMessage.description as string);
    }
  }

  expect(props.onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      ...STEPS[0].defaultValues,
      // ...STEPS[1].defaultValues,
      // ...STEPS[2].defaultValues,
    })
  );
});
