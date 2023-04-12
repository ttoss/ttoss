import { Form, FormFieldInput, FormGroup, useForm } from '../../src';
import { render } from '@ttoss/test-utils';

const RenderForm = () => {
  const formMethods = useForm();

  return (
    <Form
      {...formMethods}
      onSubmit={() => {
        return;
      }}
    >
      <FormGroup>
        <FormFieldInput name="input1" />
        <FormFieldInput name="input2" />

        <FormGroup>
          <FormFieldInput name="input3" />
          <FormFieldInput name="input4" />

          <FormGroup>
            <FormFieldInput name="input5" />

            <FormGroup>
              <FormFieldInput name="input6" />
              <FormGroup>
                <FormFieldInput name="input9" />
              </FormGroup>
              <FormGroup>
                <FormFieldInput name="input10" />
              </FormGroup>
              <FormGroup>
                <FormFieldInput name="input11" />
              </FormGroup>
            </FormGroup>
          </FormGroup>

          <FormGroup>
            <FormFieldInput name="input7" />
            <FormFieldInput name="input8" />
          </FormGroup>
        </FormGroup>
      </FormGroup>
    </Form>
  );
};

test('should be defined', () => {
  expect(FormGroup).toBeDefined();
});

test('render FormGroups with their level groups correctly', () => {
  const { container } = render(<RenderForm />);

  const NUMBER_OF_FORM_GROUPS_LEVEL_0 = 1;
  const NUMBER_OF_FORM_GROUPS_LEVEL_1 = 1;
  const NUMBER_OF_FORM_GROUPS_LEVEL_2 = 2;
  const NUMBER_OF_FORM_GROUPS_LEVEL_3 = 1;
  const NUMBER_OF_FORM_GROUPS_LEVEL_4 = 3;

  const formGroupsLevel0 = container.querySelectorAll('div[aria-level="0"]');
  const formGroupsLevel1 = container.querySelectorAll('div[aria-level="1"]');
  const formGroupsLevel2 = container.querySelectorAll('div[aria-level="2"]');
  const formGroupsLevel3 = container.querySelectorAll('div[aria-level="3"]');
  const formGroupsLevel4 = container.querySelectorAll('div[aria-level="4"]');

  expect(formGroupsLevel0).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_0);
  expect(formGroupsLevel1).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_1);
  expect(formGroupsLevel2).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_2);
  expect(formGroupsLevel3).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_3);
  expect(formGroupsLevel4).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_4);
});
