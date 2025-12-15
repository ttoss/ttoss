import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import * as React from 'react';

import { Form, FormFieldRadio, useForm, yup, yupResolver } from '../../../src';

const RADIO_OPTIONS = [
  { value: 'Ferrari', label: 'Ferrari' },
  { value: 'Mercedes', label: 'Mercedes' },
  { value: 'BMW', label: 'BMW' },
];

test('should show selected value on reset form', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm({
      defaultValues: {
        car: 'BMW',
      },
    });

    const { reset } = formMethods;

    React.useEffect(() => {
      reset({
        car: 'Mercedes',
      });
    }, [reset]);

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldRadio name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(screen.getByLabelText('Mercedes')).toBeChecked();
  expect(onSubmit).toHaveBeenCalledWith({ car: 'Mercedes' });
});

test.each(RADIO_OPTIONS)(
  'default value should be selected $value',
  async (option) => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm({
        defaultValues: {
          car: option.value,
        },
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldRadio name="car" label="Cars" options={RADIO_OPTIONS} />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.click(screen.getByText('Submit'));

    expect(screen.getByLabelText(option.value)).toBeChecked();
    expect(onSubmit).toHaveBeenCalledWith({ car: option.value });
  }
);

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldRadio name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByLabelText('BMW'));
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'BMW' });
});

test('should display error messages', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const schema = yup.object({
    car: yup.string().required('Car is required'),
  });

  const RenderForm = () => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(schema),
    });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldRadio name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(await screen.findByText('Car is required')).toBeInTheDocument();
});

describe('FormFieldRadio custom onBlur and onChange', () => {
  test('should call custom onChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldRadio
            name="car"
            label="Cars"
            options={RADIO_OPTIONS}
            onChange={customOnChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.click(screen.getByLabelText('BMW'));

    expect(customOnChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ car: 'BMW' });
  });

  test('should call custom onBlur handler while still triggering validation', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const schema = yup.object({
      car: yup.string().required('Car is required'),
    });

    const RenderForm = () => {
      const formMethods = useForm({
        mode: 'onBlur',
        resolver: yupResolver(schema),
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldRadio
            name="car"
            label="Cars"
            options={RADIO_OPTIONS}
            onBlur={customOnBlur}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const radio = screen.getByLabelText('BMW');
    await user.click(radio);
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
  });
});
