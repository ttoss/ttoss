import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button, Text } from '@ttoss/ui';
import {
  Form,
  FormFieldInput,
  FormGroup,
  useForm,
  yup,
  yupResolver,
} from 'src/index';

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

  const formGroupsLevel0 = container.querySelectorAll('div[data-level="0"]');
  const formGroupsLevel1 = container.querySelectorAll('div[data-level="1"]');
  const formGroupsLevel2 = container.querySelectorAll('div[data-level="2"]');
  const formGroupsLevel3 = container.querySelectorAll('div[data-level="3"]');
  const formGroupsLevel4 = container.querySelectorAll('div[data-level="4"]');

  expect(formGroupsLevel0).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_0);
  expect(formGroupsLevel1).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_1);
  expect(formGroupsLevel2).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_2);
  expect(formGroupsLevel3).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_3);
  expect(formGroupsLevel4).toHaveLength(NUMBER_OF_FORM_GROUPS_LEVEL_4);
});

test('should render group title', () => {
  render(
    <FormGroup title="title">
      <Text>some text</Text>
    </FormGroup>
  );

  expect(screen.getByText('title')).toBeInTheDocument();
});

test('should render group description', () => {
  render(
    <FormGroup title="title" description="description text">
      <Text>some text</Text>
    </FormGroup>
  );

  expect(screen.getByText('title')).toBeInTheDocument();
  expect(screen.getByText('description text')).toBeInTheDocument();
});

test('should render group error message', async () => {
  const user = userEvent.setup({ delay: null });

  const groupErrorMessage = 'array field must have at least 1 items';

  const FormWithError = () => {
    const schema = yup.object().shape({
      array: yup
        .array()
        .of(
          yup.object().shape({
            input: yup.string().required(),
          })
        )
        .min(1, groupErrorMessage)
        .default([]),
    });

    const formMethods = useForm({
      defaultValues: {
        array: [],
      },
      resolver: yupResolver(schema),
    });

    return (
      <Form
        {...formMethods}
        onSubmit={() => {
          return;
        }}
      >
        <FormGroup name="array">
          <Text>Some text</Text>
        </FormGroup>
        <Button type="submit">Submit</Button>
      </Form>
    );
  };

  render(<FormWithError />);

  await user.click(screen.getByText('Submit'));

  await waitFor(() => {
    expect(screen.getByText(groupErrorMessage)).toBeInTheDocument();
  });
});
