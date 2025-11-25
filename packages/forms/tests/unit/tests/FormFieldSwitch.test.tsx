import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { Form, FormFieldSwitch, useForm } from 'src/index';

test('toggle switch', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSwitch name="switch1" label="Switch 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  await user.click(screen.getByLabelText('Switch 1'));
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ switch1: true });

  await user.click(screen.getByLabelText('Switch 1'));
  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ switch1: false });
});

test('should toggle when clicking on switch element itself', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSwitch name="switch1" label="Switch 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  const switchElement = screen.getByRole('switch', {
    name: 'Switch 1',
  }) as HTMLInputElement;

  expect(switchElement.checked).toBe(false);

  // Click directly on the switch input element
  await user.click(switchElement);

  expect(switchElement.checked).toBe(true);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ switch1: true });
});

test('should toggle when clicking anywhere in the switch container', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldSwitch name="switch1" label="Switch 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  const { container } = render(<RenderForm />);

  const switchElement = screen.getByRole('switch', {
    name: 'Switch 1',
  }) as HTMLInputElement;

  expect(switchElement.checked).toBe(false);

  // Find the label that wraps both the switch and text
  const label = container.querySelector('label');

  if (!label) {
    throw new Error('Label not found');
  }

  // Click on the label container
  await user.click(label);

  expect(switchElement.checked).toBe(true);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ switch1: true });
});
