import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button, Input } from '@ttoss/ui';
import * as React from 'react';
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

describe('Combined validation (schema + rules)', () => {
  test('should validate with both schema resolver and field-level rules', async () => {
    const user = userEvent.setup({ delay: null });

    // Schema with one validation
    const combinedSchema = yup.object({
      email: yup.string().required(),
    });

    const RenderCombinedValidationForm = () => {
      const formMethods = useForm({
        resolver: yupResolver(combinedSchema),
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            rules={{
              minLength: {
                value: 100,
                message: 'Email must be at least 100 characters',
              },
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderCombinedValidationForm />);

    const input = screen.getByLabelText('Email');
    const submitButton = screen.getByText('Submit');

    await user.type(input, 'notanemail');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Email must be at least 100 characters')
      ).not.toBeInTheDocument();
    });
  });

  test('should use field-level rules when no schema resolver is provided', async () => {
    const user = userEvent.setup({ delay: null });

    const RenderRulesOnlyForm = () => {
      const formMethods = useForm({});

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="username"
            label="Username"
            defaultValue=""
            rules={{
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
              validate: (value) => {
                return (
                  /^[a-zA-Z0-9_]+$/.test(value) ||
                  'Only letters, numbers, and underscores allowed'
                );
              },
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderRulesOnlyForm />);

    const input = screen.getByLabelText('Username');
    const submitButton = screen.getByText('Submit');

    // Test required validation
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    // Test minLength validation
    await user.type(input, 'ab');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Username must be at least 3 characters')
      ).toBeInTheDocument();
    });

    // Test custom validate (pattern)
    await user.clear(input);
    await user.type(input, 'user-name!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Only letters, numbers, and underscores allowed')
      ).toBeInTheDocument();
    });

    // Test valid input
    await user.clear(input);
    await user.type(input, 'valid_user');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'valid_user',
        })
      );
    });
  });
});

describe('Form disabled state', () => {
  test('should disable all fields when useForm has disabled set to true', async () => {
    const user = userEvent.setup({ delay: null });

    const RenderDisabledForm = () => {
      const formMethods = useForm({
        disabled: true,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="firstName"
            label="First Name"
            defaultValue=""
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <FormField
            name="lastName"
            label="Last Name"
            defaultValue=""
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderDisabledForm />);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');

    expect(firstNameInput).toBeDisabled();
    expect(lastNameInput).toBeDisabled();

    // Try to type in disabled fields
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');

    // Fields should remain empty
    expect(firstNameInput).toHaveValue('');
    expect(lastNameInput).toHaveValue('');
  });

  test('should allow field-level disabled prop to override form disabled state', async () => {
    const user = userEvent.setup({ delay: null });

    const RenderMixedDisabledForm = () => {
      const formMethods = useForm({
        disabled: false,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="enabled"
            label="Enabled Field"
            defaultValue=""
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <FormField
            name="disabled"
            label="Disabled Field"
            defaultValue=""
            disabled
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
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

  test('should dynamically enable/disable form based on state', async () => {
    const user = userEvent.setup({ delay: null });

    const RenderDynamicDisabledForm = () => {
      const [disabled, setDisabled] = React.useState(false);
      const formMethods = useForm({
        disabled,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="firstName"
            label="First Name"
            defaultValue=""
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button
            type="button"
            onClick={() => {
              return setDisabled(!disabled);
            }}
          >
            Toggle Disabled
          </Button>
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderDynamicDisabledForm />);

    const input = screen.getByLabelText('First Name');
    const toggleButton = screen.getByText('Toggle Disabled');

    // Initially enabled
    expect(input).not.toBeDisabled();
    await user.type(input, 'John');
    expect(input).toHaveValue('John');

    // Toggle to disabled
    await user.click(toggleButton);
    expect(input).toBeDisabled();

    // Toggle back to enabled
    await user.click(toggleButton);
    expect(input).not.toBeDisabled();
  });

  test('should disable form during submit when using async handler', async () => {
    const user = userEvent.setup({ delay: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asyncOnSubmit = jest.fn(async (data: any) => {
      await new Promise((resolve) => {
        return setTimeout(() => {
          return resolve(data);
        }, 100);
      });
    });

    const RenderAsyncForm = () => {
      const [disabled, setDisabled] = React.useState(false);
      const formMethods = useForm({
        disabled,
      });

      return (
        <Form
          {...formMethods}
          onSubmit={async (data) => {
            setDisabled(true);
            await asyncOnSubmit(data);
            setDisabled(false);
          }}
        >
          <FormField
            name="firstName"
            label="First Name"
            defaultValue=""
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderAsyncForm />);

    const input = screen.getByLabelText('First Name');
    const submitButton = screen.getByText('Submit');

    await user.type(input, 'John');
    expect(input).not.toBeDisabled();

    // Submit form
    await user.click(submitButton);

    // Form should be disabled during submit
    await waitFor(() => {
      expect(input).toBeDisabled();
    });

    // Form should be enabled after submit completes
    await waitFor(
      () => {
        expect(input).not.toBeDisabled();
      },
      { timeout: 200 }
    );

    expect(asyncOnSubmit).toHaveBeenCalledWith({ firstName: 'John' });
  });
});

describe('InputTooltip', () => {
  test('should render inputTooltip icon next to input field', () => {
    const RenderFormWithInputTooltip = () => {
      const formMethods = useForm({});

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            inputTooltip={{
              render: 'This is a helpful tooltip',
              place: 'right',
              variant: 'info',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
        </Form>
      );
    };

    render(<RenderFormWithInputTooltip />);

    // Check that the tooltip icon is rendered
    const tooltipIcon = screen.getByLabelText('input-tooltip');
    expect(tooltipIcon).toBeInTheDocument();

    // Check that the icon is the default info icon
    const icon = screen.getByTestId('iconify-icon');
    expect(icon).toHaveAttribute('icon', 'fluent:info-24-regular');
  });

  test('should render custom inputTooltip icon when specified', () => {
    const RenderFormWithCustomIcon = () => {
      const formMethods = useForm({});

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            inputTooltip={{
              render: 'This is a helpful tooltip',
              place: 'right',
              variant: 'warning',
              icon: 'fluent:warning-24-filled',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
        </Form>
      );
    };

    render(<RenderFormWithCustomIcon />);

    // Check that the custom icon is rendered
    const icon = screen.getByTestId('iconify-icon');
    expect(icon).toHaveAttribute('icon', 'fluent:warning-24-filled');
  });

  test('should not render inputTooltip when not provided', () => {
    render(<RenderForm />);

    // Check that no input-tooltip is rendered
    expect(screen.queryByLabelText('input-tooltip')).not.toBeInTheDocument();
  });
});
