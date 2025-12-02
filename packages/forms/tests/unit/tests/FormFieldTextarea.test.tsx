import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { Form, FormFieldTextarea, useForm, yup, yupResolver } from 'src/index';

const onSubmit = jest.fn();

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
});

const RenderForm = () => {
  const formMethods = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormFieldTextarea name="firstName" label="First Name" />
      <Button type="submit">Submit</Button>
    </Form>
  );
};

test('render input and call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  render(<RenderForm />);

  await user.type(screen.getByLabelText('First Name'), 'pedro');

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ firstName: 'pedro' });
});

test('should display error message', async () => {
  const user = userEvent.setup({ delay: null });

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(screen.getByText('First name is required')).toBeInTheDocument();
  });
});

describe('FormFieldTextarea custom onBlur and onChange', () => {
  test('should call custom onChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const submitHandler = jest.fn();
    const customOnChange = jest.fn();

    const RenderFormWithCustomHandlers = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={submitHandler}>
          <FormFieldTextarea
            name="textarea1"
            label="Textarea 1"
            onChange={customOnChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderFormWithCustomHandlers />);

    const textarea = screen.getByLabelText('Textarea 1');
    await user.type(textarea, 'test');

    expect(customOnChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(submitHandler).toHaveBeenCalledWith({ textarea1: 'test' });
  });

  test('should call custom onBlur handler while still triggering validation', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderFormWithBlur = () => {
      const formMethods = useForm({
        mode: 'onBlur',
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldTextarea
            name="textarea1"
            label="Textarea 1"
            onBlur={customOnBlur}
            rules={{
              required: 'Textarea is required',
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderFormWithBlur />);

    const textarea = screen.getByLabelText('Textarea 1');
    await user.click(textarea);
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
    expect(await screen.findByText('Textarea is required')).toBeInTheDocument();
  });
});
