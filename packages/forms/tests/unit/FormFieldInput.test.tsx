import { Button } from '@ttoss/ui/src';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldInput name="input1" label="Input 1" />
        <FormFieldInput name="input2" label="Input 2" type="number" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('Input 1'), 'input1');
  await user.type(screen.getByLabelText('Input 2'), 'input2');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ input1: 'input1', input2: '2' });
});

test('should display error messages and error icon', async () => {
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
        <FormFieldInput name="firstName" label="First Name" />
        <FormFieldInput name="age" label="Age" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(await screen.findByTestId('iconify-icon')).toHaveAttribute(
    'icon',
    'warning-alt'
  );
  expect(await screen.findByText('First name is required')).toBeInTheDocument();
});
