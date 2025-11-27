import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import {
  Form,
  FormFieldPatternFormat,
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

describe('FormFieldPatternFormat custom onBlur and onValueChange', () => {
  test('should call custom onValueChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnValueChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldPatternFormat
            name="input1"
            label="input 1"
            format="#### #### #### ####"
            placeholder="1234 1234 1234 1234"
            onValueChange={customOnValueChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.type(screen.getByLabelText('input 1'), '1234123412341234');

    expect(customOnValueChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ input1: '1234123412341234' });
  });

  test('should call custom onBlur handler', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldPatternFormat
            name="input1"
            label="input 1"
            format="#### #### #### ####"
            placeholder="1234 1234 1234 1234"
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
