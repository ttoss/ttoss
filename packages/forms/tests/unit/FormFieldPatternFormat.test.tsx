import { Button } from '@ttoss/ui/src';
import {
  Form,
  FormFieldPatternFormat,
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
        <FormFieldPatternFormat
          name="input1"
          label="input 1"
          format="#### #### #### ####"
          placeholder="1234 1234 1234 1234"
        />
        <FormFieldPatternFormat
          name="input2"
          label="input 2"
          format="###.###.###-##"
          placeholder="123.456.789-00"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByLabelText('input 1'), '1234 1234 1234 1234');
  await user.type(screen.getByLabelText('input 2'), '123.123.123-00');
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({
    input1: '1234123412341234',
    input2: '12312312300',
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
      defaultValues: {
        name: 'input1',
      },
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldPatternFormat
          name="input1"
          label="input 1"
          format="#### #### #### ####"
          placeholder="1234 1234 1234 1234"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);
  await user.click(screen.getByText('Submit'));
  expect(await screen.findByText('Value is required')).toBeInTheDocument();
});
