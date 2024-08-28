import { Button } from '@ttoss/ui';
import { Form, FormFieldCheckbox, useForm } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCheckbox name="checkbox1" label="Checkbox 1" />
        <FormFieldCheckbox name="checkbox2" label="Checkbox 2" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByLabelText('Checkbox 1'));
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ checkbox1: true, checkbox2: false });
});
