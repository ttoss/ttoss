import { Button, HelpText } from '@ttoss/ui';
import { ErrorBoundary } from 'react-error-boundary';
import { Form, FormFieldInput, useForm, yup, yupResolver } from '../../src';
import { I18nProvider, defineMessage } from '@ttoss/react-i18n';
import { JSXElementConstructor, PropsWithChildren } from 'react';
import { render, screen, userEvent } from '@ttoss/test-utils/.';
import { setLocale } from 'yup';

describe('test i18n messages', () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const I18nForm = () => {
    const schema = yup.object({
      firstName: yup.string().required(),
      password: yup.string().min(3),
    });

    const formMethods = useForm({
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldInput name="firstName" label="First Name" type="text" />
        <FormFieldInput name="password" label="Password" type="password" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  const TestErrorBoundary = ({ children }: PropsWithChildren) => {
    return (
      <ErrorBoundary fallback={<HelpText>An error ocurred</HelpText>}>
        {children}
      </ErrorBoundary>
    );
  };

  const mixed_requiredMessage = 'Campo obrigatório';
  const string_minMessage = 'Precisa de mais caracteres';

  const CustomI18nProvider = ({ children }: PropsWithChildren) => {
    return (
      <I18nProvider
        locale="pt-BR"
        loadLocaleData={async () => {
          return {
            mixed_required: [
              {
                type: 0,
                value: mixed_requiredMessage,
              },
            ],
            string_min: [
              {
                type: 0,
                value: string_minMessage,
              },
            ],
          };
        }}
      >
        {children}
      </I18nProvider>
    );
  };

  const renderForm = (
    wrapper = true,
    customProvider?: JSXElementConstructor<{
      children: React.ReactElement<any, string | JSXElementConstructor<any>>;
    }>
  ) => {
    render(<I18nForm />, {
      wrapper: wrapper
        ? customProvider
          ? customProvider
          : I18nProvider
        : TestErrorBoundary,
    });
  };

  const click = async () => {
    await user.click(await screen.findByText('Submit'));
  };

  it('Should render i18n english error messages correctly', async () => {
    renderForm();
    await click();

    expect(await screen.findByText('Field is required')).toBeInTheDocument();
    expect(
      await screen.findByText('Field must be at least 3 characters')
    ).toBeInTheDocument();
  });

  it('should render error boundary when not wrapped in I18nProvider', async () => {
    renderForm(false);
    await click();

    expect(await screen.findByText('An error ocurred')).toBeInTheDocument();
  });

  it('should render messages overrided in setLocale', async () => {
    setLocale({
      mixed: {
        required: 'This field is required',
      },
      string: {
        min: 'More characters needed',
      },
    });

    renderForm();
    await click();

    expect(
      await screen.findByText('This field is required')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('More characters needed')
    ).toBeInTheDocument();
  });

  it('should render translated render messages when locale is set in provider', async () => {
    setLocale({
      mixed: {
        required: defineMessage({
          defaultMessage: 'required message',
          description: 'required message',
          // eslint-disable-next-line formatjs/no-id
          id: 'mixed_required',
        }),
      },
      string: {
        min: defineMessage({
          defaultMessage: 'min message',
          description: 'min message',
          // eslint-disable-next-line formatjs/no-id
          id: 'string_min',
        }),
      },
    });

    renderForm(true, CustomI18nProvider);
    await click();

    [mixed_requiredMessage, string_minMessage].forEach(async (message) => {
      expect(await screen.findByText(message)).toBeInTheDocument();
    });
  });
});
