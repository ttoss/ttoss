import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import * as React from 'react';

import { Form, FormFieldSegmentedControl, useForm } from '../../../src';

test('should submit correct value when clicking an option', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSegmentedControl
          name="choice"
          label="Choice"
          options={options}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Option 1'));
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ choice: 'option1' });
});

test('should render options when provided as strings', () => {
  const onSubmit = jest.fn();

  const options = ['A', 'B', 'C'];

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSegmentedControl
          name="choice"
          label="Choice"
          options={options}
        />
      </Form>
    );
  };

  render(<RenderForm />);

  expect(screen.getByText('A')).toBeInTheDocument();
  expect(screen.getByText('B')).toBeInTheDocument();
});

test('should submit default value when field is disabled', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm({ defaultValues: { choiceDisabled: 'B' } });

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSegmentedControl
          name="choiceDisabled"
          label="Disabled"
          options={['A', 'B', 'C']}
          disabled
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ choiceDisabled: 'B' });
});

test('should call onChange when provided as prop', async () => {
  const user = userEvent.setup({ delay: null });
  const onSubmit = jest.fn();
  const onChange = jest.fn();

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSegmentedControl
          name="choice"
          label="Choice"
          options={options}
          onChange={onChange}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByText('Option 2'));

  expect(onChange).toHaveBeenCalledWith('option2');
});

test('should set aria-invalid when there is a field error', async () => {
  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    // set an error to trigger aria-invalid
    React.useEffect(() => {
      formMethods.setError('choice', { message: 'Required' });
    }, []);

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSegmentedControl
          name="choice"
          label="Choice"
          options={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ]}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  // The SegmentedControl should receive aria-invalid when there's an error
  const invalid = document.querySelector('[aria-invalid="true"]');
  expect(invalid).toBeInTheDocument();
});
