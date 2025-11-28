import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import {
  Form,
  FormFieldRadioCard,
  useForm,
  yup,
  yupResolver,
} from '../../../src';

const RADIO_CARD_OPTIONS = [
  { value: 'Ferrari', label: 'Ferrari', description: 'Italian luxury car' },
  { value: 'Mercedes', label: 'Mercedes', description: 'German luxury car' },
  { value: 'BMW', label: 'BMW', description: 'German sports car' },
];

test('should submit correct value when clicking on radio card', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldRadioCard
          name="car"
          label="Cars"
          options={RADIO_CARD_OPTIONS}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  // Click on BMW text which is inside the label
  await user.click(screen.getByText('BMW'));
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
        <FormFieldRadioCard
          name="car"
          label="Cars"
          options={RADIO_CARD_OPTIONS}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(await screen.findByText('Car is required')).toBeInTheDocument();
});

describe('FormFieldRadioCard custom onBlur and onChange', () => {
  test('should call custom onChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldRadioCard
            name="car"
            label="Cars"
            options={RADIO_CARD_OPTIONS}
            onChange={customOnChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Click on BMW text which triggers the onChange
    await user.click(screen.getByText('BMW'));

    expect(customOnChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ car: 'BMW' });
  });

  test('should call custom onBlur handler', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldRadioCard
            name="car"
            label="Cars"
            options={RADIO_CARD_OPTIONS}
            onBlur={customOnBlur}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    // Find the radio inputs and click on one
    const radioInputs = screen.getAllByRole('radio');
    await user.click(radioInputs[2]); // BMW
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
  });
});
