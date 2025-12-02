import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import { Form, useForm } from '../../../src';
import { FormFieldCPFOrCNPJ } from '../../../src/Brazil';

test('should submit with valid CPF value', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCPFOrCNPJ name="input1" label="CPF or CNPJ" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  // Test with CPF-length input
  await user.type(screen.getByLabelText('CPF or CNPJ'), '12345678909');
  await user.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({
    input1: '12345678909',
  });
});

test('should submit with valid CNPJ value', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCPFOrCNPJ name="input1" label="Document" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  // Test with CNPJ-length input
  await user.type(screen.getByLabelText('Document'), '13878352000196');
  await user.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({
    input1: '13878352000196',
  });
});
