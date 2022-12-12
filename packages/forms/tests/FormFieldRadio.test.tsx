import * as yup from 'yup';
import { Button } from '@ttoss/ui';
import { Form } from '../src/Form';
import { FormFieldRadio } from '../src';
import { act, render, screen, userEvent } from '@ttoss/test-utils';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const RADIO_OPTIONS = [
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
        <FormFieldRadio name="car" label="Cars" options={RADIO_OPTIONS} />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await act(async () => {
    await user.click(screen.getByLabelText('BMW'));
    await user.click(screen.getByText('Submit'));
  });

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

  await act(async () => {
    await user.click(screen.getByText('Submit'));
  });

  expect(await screen.findByText('Car is required')).toBeInTheDocument();
});
