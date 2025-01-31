import { render, screen, userEvent, waitFor } from '@ttoss/test-utils';
import { Button, Input } from '@ttoss/ui';
import { Form, FormField, useForm, yup, yupResolver } from 'src/index';

const onSubmit = jest.fn();

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
});

const RenderForm = () => {
  const formMethods = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormField
        name="firstName"
        label="First Name"
        defaultValue={''}
        render={({ field }) => {
          return <Input {...field} />;
        }}
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
};

const RenderFormWithWarning = () => {
  const formMethods = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormField
        name="firstName"
        label="First Name"
        warning="Warning"
        defaultValue={''}
        render={({ field }) => {
          return <Input {...field} />;
        }}
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
};

test('render input and call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  render(<RenderForm />);

  await user.type(screen.getByLabelText('First Name'), 'pedro');

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ firstName: 'pedro' });
});

test('should display error message', async () => {
  const user = userEvent.setup({ delay: null });

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(screen.getByText('First name is required')).toBeInTheDocument();
  });
});

test('should display warning message and icon', async () => {
  const user = userEvent.setup({ delay: null });

  render(<RenderFormWithWarning />);

  await user.type(screen.getByLabelText('First Name'), 'pedro');

  expect(screen.getByText('Warning')).toBeInTheDocument();
  expect(screen.getByTestId('iconify-icon')).toHaveAttribute(
    'icon',
    'warning-alt'
  );
});
