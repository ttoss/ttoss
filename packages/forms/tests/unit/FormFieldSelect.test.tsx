import { Button } from '@ttoss/ui';
import { Form, FormFieldSelect, useForm, yup, yupResolver } from '../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

const RADIO_OPTIONS = [
  { value: '', label: 'Select a car' },
  { value: 'Ferrari', label: 'Ferrari' },
  { value: 'Mercedes', label: 'Mercedes' },
  { value: 'BMW', label: 'BMW' },
];

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.selectOptions(
    screen.getByRole('combobox'),
    screen.getByText('BMW')
  );

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
        <FormFieldSelect name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(await screen.findByText('Car is required')).toBeInTheDocument();
});

test('should set a default value', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect
          name="car"
          label="Cars"
          options={RADIO_OPTIONS}
          defaultValue="Ferrari"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({ car: 'Ferrari' });
});

test('should have a default a value and change correctly', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect
          name="car"
          label="Cars"
          options={RADIO_OPTIONS}
          defaultValue="Ferrari"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.selectOptions(
    screen.getByRole('combobox'),
    screen.getByText('BMW')
  );

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'BMW' });
});

test('should have an empty default when set a placeholder', async () => {
  const RADIO_OPTIONS = [
    { value: 'Ferrari', label: 'Ferrari' },
    { value: 'Mercedes', label: 'Mercedes' },
    { value: 'BMW', label: 'BMW' },
  ];

  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect
          name="car"
          label="Cars"
          options={RADIO_OPTIONS}
          placeholder="Select a car"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(
    RADIO_OPTIONS.some((opt) => {
      return opt.value === '';
    })
  ).toBeTruthy();

  expect(onSubmit).toHaveBeenCalledWith({ car: '' });
});

test('should have the first option as default when nor placeholder, defaultValue or empty value is set', async () => {
  const RADIO_OPTIONS = [
    { value: 'Ferrari', label: 'Ferrari' },
    { value: 'Mercedes', label: 'Mercedes' },
    { value: 'BMW', label: 'BMW' },
  ];

  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'Ferrari' });
});
