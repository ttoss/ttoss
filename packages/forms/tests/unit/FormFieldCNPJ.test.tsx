import { Button } from '@ttoss/ui';
import { Form, useForm, yup, yupResolver } from '../../src';
import { FormFieldCNPJ } from '../../src/Brazil';
import { render, screen, userEvent } from '@ttoss/test-utils';

test('should display error messages', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const initial = [' ', '11.111.111/1111-11', '19.526.979/0002-44'];
  const final = ['Value is required', 'Invalid CNPJ', 'Invalid CNPJ'];

  const schema = yup.object({
    input1: yup.string().required('Value is required').cnpj(),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCNPJ name="input1" label="input 1" />
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
    input1: yup.string().required('Value is required').cnpj(),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCNPJ name="input1" label="input 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);
  await user.type(screen.getByLabelText('input 1'), '13.878.352/0001-96');
  await user.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({
    input1: '13878352000196',
  });
});
