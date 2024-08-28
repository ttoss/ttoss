import { Button } from '@ttoss/ui';
import {
  Form,
  FormFieldNumericFormat,
  useForm,
  yup,
  yupResolver,
} from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

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
