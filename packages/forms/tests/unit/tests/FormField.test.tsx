import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
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
