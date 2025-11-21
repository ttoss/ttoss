import { I18nProvider } from '@ttoss/react-i18n';
import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import {
  Form,
  FormFieldCurrencyInput,
  useForm,
  yup,
  yupResolver,
} from '../../../src';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCurrencyInput
          name="input1"
          label="input 1"
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          prefix="R$ "
          allowNegative={false}
        />
        <FormFieldCurrencyInput
          name="input2"
          label="input 2"
          thousandSeparator=","
          decimalSeparator="."
          decimalScale={2}
          prefix="$ "
          allowNegative={false}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(
    <I18nProvider>
      <RenderForm />
    </I18nProvider>
  );

  await user.type(screen.getByLabelText('input 1'), '1000.50');
  await user.type(screen.getByLabelText('input 2'), '3222.2');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ input1: 1000.5, input2: 3222.2 });
});

test('should display error messages', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const schema = yup.object({
    input1: yup.string().required('Value is required'),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCurrencyInput
          name="input1"
          label="input 1"
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          prefix="R$ "
          allowNegative={false}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(
    <I18nProvider>
      <RenderForm />
    </I18nProvider>
  );
  await user.click(screen.getByText('Submit'));
  expect(await screen.findByText('Value is required')).toBeInTheDocument();
});

test('should use pt-BR locale separators by default', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCurrencyInput name="amount" label="amount" prefix="R$ " />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(
    <I18nProvider locale="pt-BR">
      <RenderForm />
    </I18nProvider>
  );

  // pt-BR uses comma as decimal and dot as thousand separator
  const input = screen.getByLabelText('amount');
  expect(input).toHaveAttribute('placeholder', 'R$ 0,00');

  await user.type(input, '1234.56');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ amount: 1234.56 });
});

test('should use en-US locale separators', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCurrencyInput name="amount" label="amount" prefix="$ " />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(
    <I18nProvider locale="en-US">
      <RenderForm />
    </I18nProvider>
  );

  // en-US uses dot as decimal and comma as thousand separator
  const input = screen.getByLabelText('amount');
  expect(input).toHaveAttribute('placeholder', '$ 0.00');

  await user.type(input, '1234.56');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ amount: 1234.56 });
});

test('should allow override of locale separators', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCurrencyInput
          name="amount"
          label="amount"
          prefix="$ "
          decimalSeparator="."
          thousandSeparator=","
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(
    <I18nProvider locale="pt-BR">
      <RenderForm />
    </I18nProvider>
  );

  // Even though locale is pt-BR, explicit separators should be used
  const input = screen.getByLabelText('amount');
  expect(input).toHaveAttribute('placeholder', '$ 0.00');

  await user.type(input, '1234.56');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ amount: 1234.56 });
});
