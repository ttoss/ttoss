import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import { Form, FormFieldInput, useForm, yup, yupResolver } from '../../../src';

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

test('should display error messages and error icon but using rules', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm({
      defaultValues: {
        age: 0,
      },
      mode: 'all',
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldInput
          name="firstName"
          label="First Name"
          rules={{
            required: 'First name is required',
          }}
        />
        <FormFieldInput
          name="age"
          label="Age"
          rules={{
            min: {
              value: 18,
              message: 'You must be at least 18 years old',
            },
          }}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(await screen.findByText('First name is required')).toBeInTheDocument();
  expect(
    await screen.findByText('You must be at least 18 years old')
  ).toBeInTheDocument();
});

describe('FormFieldInput disabled state', () => {
  test('should disable all inputs when useForm has disabled set to true', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();

    const RenderDisabledForm = () => {
      const formMethods = useForm({
        disabled: true,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="firstName" label="First Name" />
          <FormFieldInput name="email" label="Email" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderDisabledForm />);

    const firstNameInput = screen.getByLabelText('First Name');
    const emailInput = screen.getByLabelText('Email');

    expect(firstNameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();

    // Try to type in disabled fields
    await user.type(firstNameInput, 'John');
    await user.type(emailInput, 'john@example.com');

    // Fields should remain empty
    expect(firstNameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
  });

  test('should allow field-level disabled to override form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();

    const RenderMixedDisabledForm = () => {
      const formMethods = useForm({
        disabled: false,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="enabled" label="Enabled Field" />
          <FormFieldInput name="disabled" label="Disabled Field" disabled />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderMixedDisabledForm />);

    const enabledInput = screen.getByLabelText('Enabled Field');
    const disabledInput = screen.getByLabelText('Disabled Field');

    expect(enabledInput).not.toBeDisabled();
    expect(disabledInput).toBeDisabled();

    await user.type(enabledInput, 'test');
    await user.type(disabledInput, 'should not work');

    expect(enabledInput).toHaveValue('test');
    expect(disabledInput).toHaveValue('');
  });

  test('should work with different input types when disabled', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();

    const RenderMultiTypeForm = () => {
      const formMethods = useForm({
        disabled: true,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="text" label="Text" type="text" />
          <FormFieldInput name="number" label="Number" type="number" />
          <FormFieldInput name="email" label="Email" type="email" />
          <FormFieldInput name="password" label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderMultiTypeForm />);

    const textInput = screen.getByLabelText('Text');
    const numberInput = screen.getByLabelText('Number');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(textInput).toBeDisabled();
    expect(numberInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Try to interact with disabled inputs
    await user.type(textInput, 'text');
    await user.type(numberInput, '123');
    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password');

    expect(textInput).toHaveValue('');
    expect(numberInput).toHaveValue(null);
    expect(emailInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });
});
