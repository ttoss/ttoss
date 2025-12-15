import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import * as React from 'react';

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

describe('FormFieldInput defaultValue', () => {
  test('should respect defaultValue prop on component', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput
            name="input1"
            label="Input 1"
            defaultValue="test value"
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const input = screen.getByLabelText('Input 1') as HTMLInputElement;

    expect(input.value).toBe('test value');

    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ input1: 'test value' });
  });
});

describe('FormFieldInput error ref', () => {
  test('should have proper ref in error object when validation fails', async () => {
    const user = userEvent.setup({ delay: null });

    type FormData = {
      firstName: string;
    };

    let capturedErrors: unknown = null;

    const RenderForm = () => {
      const formMethods = useForm<FormData>({
        mode: 'all',
      });

      const { formState } = formMethods;

      // Capture errors for assertion
      React.useEffect(() => {
        capturedErrors = formState.errors;
      }, [formState.errors]);

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldInput
            name="firstName"
            label="First Name"
            rules={{
              required: 'First name is required',
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);
    await user.click(screen.getByText('Submit'));
    await screen.findByText('First name is required');

    // The error ref should exist
    expect(capturedErrors).toHaveProperty('firstName');

    const errorRef = (
      capturedErrors as { firstName?: { ref?: HTMLInputElement | object } }
    ).firstName?.ref;

    // React-hook-form provides a ref object that may contain either:
    // 1. The actual HTMLInputElement (if ref forwarding is working correctly), or
    // 2. A partial object with methods like {focus, select, setCustomValidity, reportValidity}
    // The ref should at minimum have the focus method for form focus functionality
    expect(errorRef).toBeDefined();
    expect(typeof (errorRef as { focus?: () => void }).focus).toBe('function');
  });
});

describe('FormFieldInput custom onBlur and onChange', () => {
  test('should call custom onChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput
            name="input1"
            label="Input 1"
            onChange={customOnChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const input = screen.getByLabelText('Input 1');
    await user.type(input, 'test');

    // Custom onChange should be called for each keystroke
    expect(customOnChange).toHaveBeenCalled();
    expect(customOnChange.mock.calls.length).toBe(4); // 't', 'e', 's', 't'

    // Form state should still be updated
    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ input1: 'test' });
  });

  test('should call custom onBlur handler while still triggering form validation', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm({
        mode: 'onBlur',
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldInput
            name="input1"
            label="Input 1"
            onBlur={customOnBlur}
            rules={{
              required: 'Input is required',
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const input = screen.getByLabelText('Input 1');
    await user.click(input);
    await user.tab(); // Trigger blur

    // Custom onBlur should be called
    expect(customOnBlur).toHaveBeenCalled();

    // Validation should still work (error message should appear)
    expect(await screen.findByText('Input is required')).toBeInTheDocument();
  });

  test('should work with both custom onChange and onBlur together', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnChange = jest.fn();
    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput
            name="input1"
            label="Input 1"
            onChange={customOnChange}
            onBlur={customOnBlur}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const input = screen.getByLabelText('Input 1');
    await user.type(input, 'hello');
    await user.tab();

    expect(customOnChange).toHaveBeenCalled();
    expect(customOnBlur).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ input1: 'hello' });
  });
});
