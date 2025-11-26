import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { Form, FormFieldCheckbox, useForm, yupResolver } from 'src/index';
import { yup } from 'src/yup/yup';

test('call onSubmit with correct data', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm({
      defaultValues: {
        checkbox1: false,
        checkbox2: false,
      },
    });

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

/**
 * If you want to fail this test, you can remove the part `uniqueId` from
 * the id definition in the FormFieldCheckbox component.
 */
test('multiples checkboxes cannot interfere with each other', async () => {
  const optimizationSchema = yup.object({
    isActivated: yup.boolean().default(false),
  });

  let optimizationsData = {};

  const OptimizationCard = ({ id }: { id: string }) => {
    const formMethods = useForm({
      mode: 'all',
      resolver: yupResolver(optimizationSchema),
    });

    const onSubmit = (data: unknown) => {
      optimizationsData = { ...optimizationsData, [id]: data };
    };

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCheckbox name="isActivated" label="Is activated?" />
        <Button sx={{ marginTop: 'lg' }} type="submit">
          Submit
        </Button>
      </Form>
    );
  };

  render(
    <>
      <OptimizationCard id="0" />
      <OptimizationCard id="1" />
    </>
  );

  const checkboxesTexts = screen.queryAllByText('Is activated?');
  const submitButtons = screen.queryAllByText('Submit');

  await userEvent.click(checkboxesTexts[0]);
  await userEvent.click(submitButtons[0]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
  });

  await userEvent.click(checkboxesTexts[1]);
  await userEvent.click(submitButtons[1]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: true },
  });

  /**
   * Changing one checkbox should not affect the other
   */
  await userEvent.click(checkboxesTexts[1]);
  await userEvent.click(submitButtons[1]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: false },
  });

  await userEvent.click(checkboxesTexts[1]);
  await userEvent.click(submitButtons[1]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: true },
  });

  await userEvent.click(checkboxesTexts[0]);
  await userEvent.click(submitButtons[0]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: false },
    '1': { isActivated: true },
  });

  await userEvent.click(checkboxesTexts[0]);
  await userEvent.click(submitButtons[0]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: true },
  });
});

test('should respect defaultValue prop on component', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCheckbox
          name="checkbox1"
          label="Checkbox 1"
          defaultValue={true}
        />
        <FormFieldCheckbox
          name="checkbox2"
          label="Checkbox 2"
          defaultValue={false}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  const checkbox1 = screen.getByLabelText('Checkbox 1') as HTMLInputElement;
  const checkbox2 = screen.getByLabelText('Checkbox 2') as HTMLInputElement;

  expect(checkbox1.checked).toBe(true);
  expect(checkbox2.checked).toBe(false);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ checkbox1: true, checkbox2: false });
});

test('should default to false when no defaultValue provided', async () => {
  const user = userEvent.setup({ delay: null });

  const onSubmit = jest.fn();

  const RenderForm = () => {
    const formMethods = useForm();

    return (
      <Form {...formMethods} onSubmit={onSubmit}>
        <FormFieldCheckbox name="checkbox1" label="Checkbox 1" />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  const checkbox = screen.getByLabelText('Checkbox 1') as HTMLInputElement;

  expect(checkbox.checked).toBe(false);

  await user.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ checkbox1: false });
});

test('should have proper ref in error object when validation fails', async () => {
  const user = userEvent.setup({ delay: null });

  type FormData = {
    acceptTerms: boolean;
  };

  let capturedErrors: unknown = null;

  const RenderForm = () => {
    const formMethods = useForm<FormData>({
      mode: 'all',
    });

    const { formState } = formMethods;

    // Capture errors for assertion
    capturedErrors = formState.errors;

    return (
      <Form {...formMethods} onSubmit={jest.fn()}>
        <FormFieldCheckbox
          name="acceptTerms"
          label="Accept Terms"
          rules={{
            validate: (value) => {
              return value === true || 'You must accept the terms';
            },
          }}
        />
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<RenderForm />);

  // Submit without checking the checkbox
  await user.click(screen.getByText('Submit'));

  // Wait for error to appear
  await screen.findByText('You must accept the terms');

  // The error ref should exist
  expect(capturedErrors).toHaveProperty('acceptTerms');

  const errorRef = (
    capturedErrors as { acceptTerms?: { ref?: HTMLInputElement | object } }
  ).acceptTerms?.ref;

  // React-hook-form provides a ref object that may contain either:
  // 1. The actual HTMLInputElement (if ref forwarding is working correctly), or
  // 2. A partial object with methods like {focus, select, setCustomValidity, reportValidity}
  // The ref should at minimum have the focus method for form focus functionality
  expect(errorRef).toBeDefined();
  expect(typeof (errorRef as { focus?: () => void }).focus).toBe('function');
});
