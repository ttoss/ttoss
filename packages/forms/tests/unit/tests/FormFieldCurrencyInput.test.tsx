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

  render(<RenderForm />);

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

  render(<RenderForm />);
  await user.click(screen.getByText('Submit'));
  expect(await screen.findByText('Value is required')).toBeInTheDocument();
});

describe('FormFieldCurrencyInput custom onBlur and onValueChange', () => {
  test('should call custom onValueChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnValueChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldCurrencyInput
            name="amount"
            label="Amount"
            prefix="$ "
            onValueChange={customOnValueChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.type(screen.getByLabelText('Amount'), '100');

    expect(customOnValueChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ amount: 100 });
  });

  test('should call custom onBlur handler', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldCurrencyInput
            name="amount"
            label="Amount"
            prefix="$ "
            onBlur={customOnBlur}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const input = screen.getByLabelText('Amount');
    await user.click(input);
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
  });
});
