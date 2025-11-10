import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import { Form, FormFieldRadioCardIcony, useForm } from '../../../src';

test('submete o valor correto ao clicar na opção', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();

  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ];

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldRadioCardIcony
          name="choice"
          label="Choice"
          options={options}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Option 1'));
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ choice: 'opt1' });
});

test('renderiza o ícone quando fornecido na opção', () => {
  const onSubmit = jest.fn();

  const Icon = () => {
    return <span data-testid="radio-icon" />;
  };

  const options = [
    { value: 'opt1', label: 'Option 1', icon: Icon },
    { value: 'opt2', label: 'Option 2' },
  ];

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldRadioCardIcony
          name="choice"
          label="Choice"
          options={options}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  expect(screen.getByTestId('radio-icon')).toBeInTheDocument();
});
