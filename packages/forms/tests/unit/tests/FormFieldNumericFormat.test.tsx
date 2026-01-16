import { I18nProvider } from '@ttoss/react-i18n';
import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import {
  Form,
  FormFieldNumericFormat,
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
        <FormFieldNumericFormat
          name="input1"
          label="input 1"
          thousandSeparator="."
          decimalSeparator=","
          decimalScale={2}
          prefix="R$ "
          allowNegative={false}
        />
        <FormFieldNumericFormat
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

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '1.249');
  await user.type(screen.getByLabelText('input 2'), '3222');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ input1: 1.24, input2: 3222 });
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
        <FormFieldNumericFormat
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

  render(<RenderForm />);
  await user.click(screen.getByText('Submit'));
  expect(await screen.findByText('Value is required')).toBeInTheDocument();
});

describe('FormFieldNumericFormat custom onBlur and onValueChange', () => {
  test('should call custom onValueChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnValueChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldNumericFormat
            name="input1"
            label="input 1"
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            prefix="R$ "
            allowNegative={false}
            onValueChange={customOnValueChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.type(screen.getByLabelText('input 1'), '100');

    expect(customOnValueChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ input1: 100 });
  });

  test('should call custom onBlur handler', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldNumericFormat
            name="input1"
            label="input 1"
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            prefix="R$ "
            allowNegative={false}
            onBlur={customOnBlur}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const input = screen.getByLabelText('input 1');
    await user.click(input);
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
  });
});

describe('FormFieldNumericFormat i18n separators', () => {
  test('should use default i18n separators when not specified', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldNumericFormat
            name="amount"
            label="Amount"
            decimalScale={2}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />, { wrapper: I18nProvider });

    await user.type(screen.getByLabelText('Amount'), '1234.56');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ amount: 1234.56 });
  });

  test('should override i18n separators with explicit props', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldNumericFormat
            name="amount"
            label="Amount"
            decimalSeparator=","
            thousandSeparator="."
            decimalScale={2}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />, { wrapper: I18nProvider });

    await user.type(screen.getByLabelText('Amount'), '1234.56');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({ amount: 1234.56 });
  });
});
