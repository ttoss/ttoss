import { Button } from '@ttoss/ui/src';
import {
  Form,
  FormFieldCreditCardNumber,
  useForm,
  yup,
  yupResolver,
} from '../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCreditCardNumber name="input1" label="input 1" />

        <FormFieldCreditCardNumber name="input2" label="input 2" />

        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '1111 1111 1111 1111');
  await user.type(screen.getByLabelText('input 2'), '1212 2323 3434 4545');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({
    input1: '1111111111111111',
    input2: '1212232334344545',
  });
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
        <FormFieldCreditCardNumber name="input1" label="input 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);
  await user.click(screen.getByText('Submit'));
  expect(await screen.findByText('Value is required')).toBeInTheDocument();
});
