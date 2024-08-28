import { Button } from '@ttoss/ui';
import { Form, FormFieldPassword, useForm } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

test('should hide password by default if prop showPasswordByDefault is not passed and call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const formValues = {
    password: 'password',
    passwordConfirmation: 'passwordConfirmation',
  };

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPassword name="password" label="Password" />
        <FormFieldPassword
          name="passwordConfirmation"
          label="Password Confirmation"
          showPasswordByDefault
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('Password'), formValues.password);
  await user.type(
    screen.getByLabelText('Password Confirmation'),
    formValues.passwordConfirmation
  );

  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  expect(screen.getByLabelText('Password Confirmation')).toHaveAttribute(
    'type',
    'text'
  );

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith(formValues);
});

test('should change type visibility when click on icon', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPassword name="password" label="Password" />
      </Form>
    );
  };

  render(<RenderForm />);

  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

  await user.click(screen.getByTestId('iconify-icon'));

  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
});
