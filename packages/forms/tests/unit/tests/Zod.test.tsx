import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { FormFieldCNPJ } from 'src/Brazil/FormFieldCNPJ';
import { FormFieldCPF } from 'src/Brazil/FormFieldCPF';
import { Form, FormFieldInput, useForm, z, zodResolver } from 'src/index';
import { passwordSchema } from 'src/zod/schema';

describe('Zod Integration', () => {
  test('should export z and zodResolver', () => {
    expect(z).toBeDefined();
    expect(zodResolver).toBeDefined();
  });

  test('should validate with zod schema', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldInput name="name" label="Name" />
          <FormFieldInput name="email" label="Email" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('Name is required');
  });

  test('should validate string minimum length', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      username: z.string().min(5, 'Username must be at least 5 characters'),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldInput name="username" label="Username" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Username');
    await user.type(input, 'abc');

    await waitFor(() => {
      expect(input).toHaveValue('abc');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('Username must be at least 5 characters');
  });

  test('should validate invalid type', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      age: z.number(),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldInput name="age" label="Age" type="text" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Age');
    await user.type(input, 'not a number');

    await waitFor(() => {
      expect(input).toHaveValue('not a number');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText(/Invalid Value for Field/);
  });

  test('should validate CNPJ with custom zod method', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cnpj: z.string().cnpj(),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldCNPJ name="cnpj" label="CNPJ" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CNPJ');
    await user.type(input, '12.345.678/0001-90'); // Invalid CNPJ

    await waitFor(() => {
      expect(input).toHaveValue('12.345.678/0001-90');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('Invalid CNPJ');
  });

  test('should validate CNPJ with custom error message', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cnpj: z.string().cnpj('CNPJ inválido'),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldCNPJ name="cnpj" label="CNPJ" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CNPJ');
    await user.type(input, '12.345.678/0001-90'); // Invalid CNPJ

    await waitFor(() => {
      expect(input).toHaveValue('12.345.678/0001-90');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('CNPJ inválido');
  });

  test('should validate CPF with custom zod method', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cpf: z.string().cpf(),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldCPF name="cpf" label="CPF" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CPF');
    await user.type(input, '123.456.789-00'); // Invalid CPF

    await waitFor(() => {
      expect(input).toHaveValue('123.456.789-00');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('Invalid CPF');
  });

  test('should validate CPF with custom error message', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cpf: z.string().cpf('CPF inválido'),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldCPF name="cpf" label="CPF" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CPF');
    await user.type(input, '123.456.789-00'); // Invalid CPF

    await waitFor(() => {
      expect(input).toHaveValue('123.456.789-00');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('CPF inválido');
  });

  test('should accept valid CNPJ', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cnpj: z.string().cnpj(),
    });

    const onSubmit = jest.fn();

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldCNPJ name="cnpj" label="CNPJ" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CNPJ');
    await user.type(input, '11.222.333/0001-81'); // Valid CNPJ

    await waitFor(() => {
      expect(input).toHaveValue('11.222.333/0001-81');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('should accept valid CPF', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cpf: z.string().cpf(),
    });

    const onSubmit = jest.fn();

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldCPF name="cpf" label="CPF" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CPF');
    await user.type(input, '123.456.789-09'); // Valid CPF

    await waitFor(() => {
      expect(input).toHaveValue('123.456.789-09');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('should validate required password', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      password: passwordSchema({ required: true }),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldInput name="password" label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Password');
    await user.type(input, 'short');

    await waitFor(() => {
      expect(input).toHaveValue('short');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 8 characters long/)
      ).toBeInTheDocument();
    });
  });

  test('should validate optional password', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      password: passwordSchema(), // defaults to optional
    });

    const onSubmit = jest.fn();

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="password" label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('should chain CNPJ validation after other refinements', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cnpj: z
        .string()
        .trim()
        .min(1, 'CNPJ is required')
        .cnpj('Invalid CNPJ format'),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldCNPJ name="cnpj" label="CNPJ" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CNPJ');
    await user.type(input, '  12.345.678/0001-90  '); // Invalid CNPJ with spaces

    await waitFor(() => {
      expect(input).toHaveValue('12.345.678/0001-90');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('Invalid CNPJ format');
  });

  test('should chain CPF validation after other refinements', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      cpf: z
        .string()
        .trim()
        .min(1, 'CPF is required')
        .cpf('Invalid CPF format'),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldCPF name="cpf" label="CPF" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('CPF');
    await user.type(input, '  123.456.789-00  '); // Invalid CPF with spaces

    await waitFor(() => {
      expect(input).toHaveValue('123.456.789-00');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText('Invalid CPF format');
  });

  test('should accept valid password with required flag', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      password: passwordSchema({ required: true }),
    });

    const onSubmit = jest.fn();

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="password" label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Password');
    await user.type(input, 'ValidPassword123!');

    await waitFor(() => {
      expect(input).toHaveValue('ValidPassword123!');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('should accept valid optional password when provided', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      password: passwordSchema({ required: false }),
    });

    const onSubmit = jest.fn();

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="password" label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Password');
    await user.type(input, 'ValidPassword123!');

    await waitFor(() => {
      expect(input).toHaveValue('ValidPassword123!');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('should reject invalid optional password', async () => {
    const user = userEvent.setup({ delay: null });
    const schema = z.object({
      password: passwordSchema({ required: false }),
    });

    const TestComponent = () => {
      const formMethods = useForm({
        resolver: zodResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={() => {}}>
          <FormFieldInput name="password" label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByLabelText('Password');
    await user.type(input, 'short');

    await waitFor(() => {
      expect(input).toHaveValue('short');
    });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await screen.findByText(/Password must be at least 8 characters long/);
  });
});
