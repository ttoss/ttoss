import { render, screen, userEvent } from '@ttoss/test-utils';
import { Button } from '@ttoss/ui';
import { Form, FormFieldCheckbox, useForm, yupResolver } from 'src/index';
import { yup } from 'src/yup/yup';

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

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: false },
  });

  await userEvent.click(checkboxesTexts[1]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: true },
  });

  await userEvent.click(checkboxesTexts[0]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: false },
    '1': { isActivated: true },
  });

  await userEvent.click(checkboxesTexts[0]);

  expect(optimizationsData).toEqual({
    '0': { isActivated: true },
    '1': { isActivated: true },
  });
});
