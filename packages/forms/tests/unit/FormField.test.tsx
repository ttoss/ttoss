import { Button, Input } from '@ttoss/ui';
import { Form, FormField, useForm, yup, yupResolver } from '../../src';
import { act, render, screen, userEvent } from '@ttoss/test-utils';

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

  expect(screen.getByText('First name is required')).toBeInTheDocument();
});
