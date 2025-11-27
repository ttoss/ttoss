import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import { Form, useForm, yup, yupResolver } from '../../../src';
import { FormFieldCPF } from '../../../src/Brazil';

test('should display error messages', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const initial = [' ', '111.111.111-11', '123.456.789-10'];
  const final = ['Value is required', 'Invalid CPF', 'Invalid CPF'];

  const schema = yup.object({
    input1: yup.string().required('Value is required').cpf(),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCPF name="input1" label="input 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  for (let i = 0; i < initial.length; i++) {
    await user.type(screen.getByLabelText('input 1'), initial[i].toString());
    await user.click(screen.getByText('Submit'));

    expect(await screen.findByText(final[i].toString())).toBeInTheDocument();
  }
});

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const schema = yup.object({
    input1: yup.string().required('Value is required').cpf(),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCPF name="input1" label="input 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);
  await user.type(screen.getByLabelText('input 1'), '123.456.789-09');
  await user.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({
    input1: '12345678909',
  });
});
