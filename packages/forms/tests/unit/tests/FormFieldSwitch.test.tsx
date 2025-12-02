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

describe('FormFieldSwitch custom onBlur and onChange', () => {
  test('should call custom onChange handler while still updating form state', async () => {
    const user = userEvent.setup({ delay: null });

    const onSubmit = jest.fn();
    const customOnChange = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm();

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldSwitch
            name="switch1"
            label="Switch 1"
            onChange={customOnChange}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    await user.click(screen.getByLabelText('Switch 1'));

    expect(customOnChange).toHaveBeenCalled();

    await user.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalledWith({ switch1: true });
  });

  test('should call custom onBlur handler while still triggering validation', async () => {
    const user = userEvent.setup({ delay: null });

    const customOnBlur = jest.fn();

    const RenderForm = () => {
      const formMethods = useForm({
        mode: 'onBlur',
      });

      return (
        <Form {...formMethods} onSubmit={jest.fn()}>
          <FormFieldSwitch
            name="switch1"
            label="Switch 1"
            onBlur={customOnBlur}
            rules={{
              validate: (value) => {
                return value === true || 'Switch must be on';
              },
            }}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderForm />);

    const switchElement = screen.getByLabelText('Switch 1');
    await user.click(switchElement);
    await user.click(switchElement); // Turn off
    await user.tab();

    expect(customOnBlur).toHaveBeenCalled();
    expect(await screen.findByText('Switch must be on')).toBeInTheDocument();
  });
});
