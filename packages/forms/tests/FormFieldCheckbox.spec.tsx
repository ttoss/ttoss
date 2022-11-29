import { Button } from '@ttoss/ui';
import { Form, FormField } from '../src/';
import { act, render, screen, userEvent } from '@ttoss/test-utils';
import { useForm } from 'react-hook-form';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormField.Checkbox name="checkbox1" label="Checkbox 1" />
        <FormField.Checkbox name="checkbox2" label="Checkbox 2" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await act(async () => {
    await user.click(screen.getByLabelText('Checkbox 1'));
    await user.click(screen.getByText('Submit'));
  });

  expect(onSubmit).toHaveBeenCalledWith({ checkbox1: true, checkbox2: false });
});
