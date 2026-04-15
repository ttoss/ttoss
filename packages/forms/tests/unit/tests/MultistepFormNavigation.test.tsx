/* eslint-disable formatjs/no-literal-string-in-jsx */
import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { MultistepForm, type MultistepStep } from 'src/MultistepForm';

test('MultistepForm navigates steps and calls onSubmit', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();

  const steps: MultistepStep[] = [
    {
      question: 'Q1',
      flowMessage: {
        variant: 'image-text',
        src: 'image1.png',
        description: 'M1',
      },
      label: 'Step 1',
      fields: <div>Step1</div>,
    },
    {
      question: 'Q2',
      flowMessage: {
        variant: 'image-text',
        src: 'image2.png',
        description: 'M2',
      },
      label: 'Step 2',
      fields: <div>Step2</div>,
    },
  ];

  render(
    <MultistepForm
      header={{ variant: 'logo', src: 'logo.png' }}
      steps={steps}
      footer="Footer text"
      onSubmit={onSubmit}
    />
  );

  // initial step content
  expect(screen.getByText('Step1')).toBeInTheDocument();

  await user.click(screen.getByText('Next'));

  // second step shows
  expect(screen.getByText('Step2')).toBeInTheDocument();

  // submit final
  await user.click(screen.getByText('Send'));

  expect(onSubmit).toHaveBeenCalled();
});
