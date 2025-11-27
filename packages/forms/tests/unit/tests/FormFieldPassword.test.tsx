import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import { Form, FormFieldPassword, useForm } from '../../../src';

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

describe('FormFieldPassword custom onBlur and onChange', () => {
  test('should call custom onChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPassword
            name="password"
            label="Password"
            onChange={customOnChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'secret');

    expect(customOnChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ password: 'secret' });
  });

  test('should call custom onBlur handler while still triggering validation', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm({
        mode: 'onBlur',
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldPassword
            name="password"
            label="Password"
            onBlur={customOnBlur}
            rules={{
              required: 'Password is required',
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const passwordInput = screen.getByLabelText('Password');
    await user.click(passwordInput);
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });
});
