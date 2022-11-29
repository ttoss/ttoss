import * as yup from 'yup';
import { Button } from '@ttoss/ui';
import { Form, FormField } from '../src';
import { act, render, screen, userEvent } from '@ttoss/test-utils';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormField.Input name="input1" label="Input 1" />
        <FormField.Input name="input2" label="Input 2" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await act(async () => {
    await user.type(screen.getByLabelText('Input 1'), 'input1');

    await user.type(screen.getByLabelText('Input 2'), 'input2');

    await user.click(screen.getByText('Submit'));
  });

  expect(onSubmit).toHaveBeenCalledWith({ input1: 'input1', input2: 'input2' });
});

test('should display error messages', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const schema = yup.object({
    firstName: yup.string().required('First name is required'),
    age: yup.number().required('Age is required'),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      defaultValues: {
        age: 0,
      },
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormField.Input name="firstName" label="First Name" />
        <FormField.Input name="age" label="Age" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await act(async () => {
    await user.click(screen.getByText('Submit'));
  });

  expect(await screen.findByText('First name is required')).toBeInTheDocument();
});
