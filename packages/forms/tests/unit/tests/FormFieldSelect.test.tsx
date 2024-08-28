import * as React from 'react';
import { Button } from '@ttoss/ui';
import { Form, FormFieldSelect, useForm, yup, yupResolver } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

const OPTIONS = [
  { value: 'ferrari', label: 'Ferrari' },
  { value: 'mercedes', label: 'Mercedes' },
  { value: 'bmw', label: 'BMW' },
];

test('should disable the select', () => {
  const placeholder = 'Select a car';

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect
          name="car"
          label="Cars"
          options={OPTIONS}
          disabled
          placeholder={placeholder}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  const select = screen.queryByRole('combobox');

  /**
   * When a select is disabled, the query returns null, which can be
   * interpreted as the element is not in the DOM.
   */
  expect(select).not.toBeInTheDocument();
});

test('call onSubmit with correct data by clicking', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect name="car" label="Cars" options={OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByRole('combobox'));

  await user.click(screen.getByText('BMW'));

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'bmw' });
});

test('call onSubmit with correct data by typing', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect name="car" label="Cars" options={OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.type(screen.getByRole('combobox'), 'BMW{enter}');

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'bmw' });
});

test('should display error messages and error icon', async () => {
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
        <FormFieldSelect name="car" label="Cars" options={OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  const icons = await screen.findAllByTestId('iconify-icon');

  const errorIcon = icons.find((iconEl) => {
    return iconEl.parentElement?.className.includes('error-icon');
  });

  expect(errorIcon).toHaveAttribute('icon', 'warning-alt');
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
          options={OPTIONS}
          defaultValue="ferrari"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  const ferrariLabel = await screen.findByText('Ferrari');

  expect(ferrariLabel).toBeInTheDocument();

  await user.click(screen.getByText('Submit'));
  expect(onSubmit).toHaveBeenCalledWith({ car: 'ferrari' });
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
          options={OPTIONS}
          defaultValue="ferrari"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByRole('combobox'));

  await user.click(screen.getByText('BMW'));

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'bmw' });
});

test('should return undefined when no option is selected', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect
          name="car"
          label="Cars"
          options={OPTIONS}
          placeholder="Select a car"
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  expect(screen.getByText('Select a car')).toBeInTheDocument();

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: undefined });
});

test('When fetching, should display values correctly', async () => {
  const OPTIONS = [
    { value: 'Ferrari', label: 'Ferrari' },
    { value: 'Mercedes', label: 'Mercedes' },
    { value: 'BMW', label: 'BMW' },
  ];

  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();
    const { resetField } = formMethods;
    const [formOptions, setFormOptions] = React.useState<
      {
        value: string;
        label: string;
      }[]
    >([]);

    React.useEffect(() => {
      setFormOptions(OPTIONS);
      // fetch are side effects, so, if the options depends on fetch and have a default value, the field should be reseted in the effect
      resetField('car', { defaultValue: 'ferrari' });
    }, [resetField]);

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSelect name="car" label="Cars" options={formOptions} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ car: 'ferrari' });
});
