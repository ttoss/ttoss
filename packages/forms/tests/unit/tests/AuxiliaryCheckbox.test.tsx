import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button, Input } from '@ttoss/ui';
import {
  Form,
  FormField,
  FormFieldInput,
  useForm,
  yup,
  yupResolver,
} from 'src/index';

describe('FormField with auxiliaryCheckbox', () => {
  test('should render auxiliaryCheckbox between field and error message', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Check that both the input and checkbox are rendered
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'I confirm this is my email' })
    ).toBeInTheDocument();

    // Fill in email and check the confirmation checkbox
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(
      screen.getByRole('checkbox', { name: 'I confirm this is my email' })
    );

    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      confirmEmail: true,
    });
  });

  test('should support auxiliaryCheckbox with defaultValue', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="name"
            label="Name"
            defaultValue=""
            auxiliaryCheckbox={{
              name: 'showAdvanced',
              label: 'Show advanced options',
              defaultValue: true,
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Show advanced options',
    }) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);

    await user.type(screen.getByLabelText('Name'), 'John');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John',
      showAdvanced: true,
    });
  });

  test('should support auxiliaryCheckbox with validation rules and display errors', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const schema = yup.object({
      email: yup.string().required('Email is required'),
      confirmEmail: yup.boolean().oneOf([true], 'You must confirm your email'),
    });

    const RenderForm = () => {
      const formMethods = useForm({
        resolver: yupResolver(schema),
        mode: 'all',
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Fill in email but don't check the confirmation checkbox
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByText('Submit'));

    // Form should not submit because validation fails
    expect(onSubmit).not.toHaveBeenCalled();

    // The auxiliaryCheckbox error should be displayed
    await waitFor(() => {
      expect(
        screen.getByText('You must confirm your email')
      ).toBeInTheDocument();
    });

    // Check the confirmation checkbox
    await user.click(
      screen.getByRole('checkbox', { name: 'I confirm this is my email' })
    );
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        confirmEmail: true,
      });
    });
  });

  test('should show FormField error first before auxiliaryCheckbox error', async () => {
    const user = userEvent.setup({ delay: null });

    const schema = yup.object({
      email: yup.string().required('Email is required'),
      confirmEmail: yup.boolean().oneOf([true], 'You must confirm your email'),
    });

    const RenderForm = () => {
      const formMethods = useForm({
        resolver: yupResolver(schema),
        mode: 'all',
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Submit without filling anything - both have errors
    await user.click(screen.getByText('Submit'));

    // The FormField error should be displayed (takes precedence)
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // auxiliaryCheckbox error should NOT be visible while FormField has error
    expect(
      screen.queryByText('You must confirm your email')
    ).not.toBeInTheDocument();

    // Fill in email to clear the FormField error
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByText('Submit'));

    // Now the auxiliaryCheckbox error should be visible
    await waitFor(() => {
      expect(
        screen.getByText('You must confirm your email')
      ).toBeInTheDocument();
    });
  });

  test('auxiliaryCheckbox should inherit disabled state from FormField', async () => {
    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            disabled={true}
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const emailInput = screen.getByLabelText('Email');
    const checkbox = screen.getByRole('checkbox', {
      name: 'I confirm this is my email',
    });

    expect(emailInput).toBeDisabled();
    expect(checkbox).toBeDisabled();
  });

  test('auxiliaryCheckbox should inherit disabled state from form', async () => {
    const RenderForm = () => {
      const formMethods = useForm({
        disabled: true,
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const emailInput = screen.getByLabelText('Email');
    const checkbox = screen.getByRole('checkbox', {
      name: 'I confirm this is my email',
    });

    expect(emailInput).toBeDisabled();
    expect(checkbox).toBeDisabled();
  });

  test('should toggle auxiliaryCheckbox by clicking label', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormField
            name="email"
            label="Email"
            defaultValue=""
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
            render={({ field }) => {
              return <Input {...field} />;
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'I confirm this is my email',
    }) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    // Click on the label text
    await user.click(screen.getByText('I confirm this is my email'));

    expect(checkbox.checked).toBe(true);
  });
});

describe('FormFieldInput with auxiliaryCheckbox', () => {
  test('should render auxiliaryCheckbox on FormFieldInput', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput
            name="email"
            label="Email"
            auxiliaryCheckbox={{
              name: 'confirmEmail',
              label: 'I confirm this is my email',
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Check that both the input and checkbox are rendered
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'I confirm this is my email' })
    ).toBeInTheDocument();

    // Fill in email and check the confirmation checkbox
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(
      screen.getByRole('checkbox', { name: 'I confirm this is my email' })
    );

    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      confirmEmail: true,
    });
  });
});
