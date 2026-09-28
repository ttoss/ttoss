import { I18nProvider } from '@ttoss/react-i18n';
import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { validationMessages } from 'src/i18n/messages';
import { Form, FormFieldInput, useForm, z, zodResolver } from 'src/index';
import {
  configureZodI18n,
  createZodErrorMap,
  formatDefaultMessage,
  installZodFallbackErrorMap,
} from 'src/zod/i18n';
import { passwordSchema } from 'src/zod/schema';
import { en } from 'zod/locales';

type Issue = Parameters<ReturnType<typeof createZodErrorMap>>[0];

const formatMessage = jest.fn((descriptor, values) => {
  return `${descriptor.id}${values ? JSON.stringify(values) : ''}`;
});

const errorMap = createZodErrorMap({ formatMessage });

const issue = (fields: Record<string, unknown>) => {
  return fields as unknown as Issue;
};

afterEach(() => {
  z.config({ ...en(), customError: undefined });
});

describe('createZodErrorMap', () => {
  test('renders a ttoss refinement from the catalog', () => {
    expect(
      errorMap(issue({ code: 'custom', params: { ttoss: 'invalidCpf' } }))
    ).toBe(validationMessages.invalidCpf.id);
  });

  test('leaves a custom issue it does not own to Zod', () => {
    expect(errorMap(issue({ code: 'custom' }))).toBeUndefined();
    expect(
      errorMap(issue({ code: 'custom', params: { ttoss: 'unknown' } }))
    ).toBeUndefined();
  });

  test('renders a missing value as required', () => {
    expect(errorMap(issue({ code: 'invalid_type', expected: 'string' }))).toBe(
      validationMessages.required.id
    );
  });

  test('leaves a wrong-typed value to Zod', () => {
    expect(
      errorMap(issue({ code: 'invalid_type', expected: 'number', input: 'x' }))
    ).toBeUndefined();
  });

  test('renders an empty string as required and a short one as min length', () => {
    expect(
      errorMap(issue({ code: 'too_small', origin: 'string', minimum: 1 }))
    ).toBe(validationMessages.required.id);
    expect(
      errorMap(issue({ code: 'too_small', origin: 'string', minimum: 3 }))
    ).toBe(`${validationMessages.minLength.id}{"min":3}`);
  });

  test('leaves other issues to Zod', () => {
    expect(
      errorMap(issue({ code: 'too_small', origin: 'number', minimum: 3 }))
    ).toBeUndefined();
  });
});

describe('formatDefaultMessage', () => {
  test('renders a source string', () => {
    expect(
      formatDefaultMessage(
        { id: 'x', defaultMessage: 'At least {min}' },
        {
          min: 3,
        }
      )
    ).toBe('At least 3');
  });

  test('renders a compiled AST', () => {
    expect(formatDefaultMessage(validationMessages.minLength, { min: 4 })).toBe(
      'Field must be at least 4 characters'
    );
  });
});

describe('configureZodI18n', () => {
  test("uses Zod's own locale for messages ttoss does not own", () => {
    configureZodI18n({ locale: 'pt-BR', formatMessage });

    expect(z.number().safeParse('x').error?.issues[0].message).toBe(
      'Tipo inválido: esperado número, recebido string'
    );
  });

  test('falls back to English for a language Zod has no locale for here', () => {
    configureZodI18n({ locale: 'xx-YY', formatMessage });

    expect(z.number().safeParse('x').error?.issues[0].message).toBe(
      'Invalid input: expected number, received string'
    );
  });

  test('renders the ttoss messages through formatMessage', () => {
    configureZodI18n({ locale: 'pt-BR', formatMessage });

    expect(z.string().cpf().safeParse('123').error?.issues[0].message).toBe(
      validationMessages.invalidCpf.id
    );
  });
});

describe('installZodFallbackErrorMap', () => {
  test('keeps the ttoss refinements in English without a locale', () => {
    installZodFallbackErrorMap();

    expect(z.string().cpf().safeParse('123').error?.issues[0].message).toBe(
      'Invalid CPF'
    );
    expect(
      passwordSchema({ required: true }).safeParse('short').error?.issues[0]
        .message
    ).toBe('Password must be at least 8 characters long');
    expect(z.number().safeParse('x').error?.issues[0].message).toBe(
      'Invalid input: expected number, received string'
    );
  });

  test('does not replace an error map someone already configured', () => {
    const customError = () => {
      return 'mine';
    };
    z.config({ customError });

    installZodFallbackErrorMap();

    expect(z.config().customError).toBe(customError);
  });

  test('a message passed to cpf() wins over the catalog', () => {
    installZodFallbackErrorMap();

    expect(
      z.string().cpf('Documento inválido').safeParse('123').error?.issues[0]
        .message
    ).toBe('Documento inválido');
  });
});

test('Form renders Zod errors in the I18nProvider locale', async () => {
  const user = userEvent.setup({ delay: null });

  const TestForm = () => {
    const formMethods = useForm({
      resolver: zodResolver(z.object({ name: z.string().min(1) })),
    });

    return (
      <Form {...formMethods} onSubmit={jest.fn()}>
        <FormFieldInput name="name" label="Name" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(
    <I18nProvider
      locale="pt-BR"
      loadLocaleData={() => {
        return {
          [validationMessages.required.id as string]: 'Campo obrigatório',
        };
      }}
    >
      <TestForm />
    </I18nProvider>
  );

  // The pt-BR catalog loads asynchronously; Zod follows once it has.
  await waitFor(() => {
    expect(z.number().safeParse('x').error?.issues[0].message).toMatch(
      /^Tipo inválido/
    );
  });

  await user.click(await screen.findByText('Submit'));

  expect(await screen.findByText('Campo obrigatório')).toBeInTheDocument();
});
