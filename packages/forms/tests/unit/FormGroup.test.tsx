import {
  Form,
  FormFieldInput,
  FormGroup,
  useForm,
  useFormGroup,
} from '../../src';
import { Text } from '@ttoss/ui';
import { render, screen } from '@ttoss/test-utils';

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

const FormGroupItem = ({ name }: { name: string }) => {
  const { level, maxLevel } = useFormGroup();

  const text = [name, 'level', level, 'maxLevel', maxLevel].join('-');

  return <Text>{text}</Text>;
};

test('render form groups with their correct level and maxLevel = 1', () => {
  const Form = () => {
    return (
      <FormGroup>
        <FormGroupItem name="group1" />
        <FormGroupItem name="group2" />
        <FormGroupItem name="group3" />
      </FormGroup>
    );
  };

  render(<Form />);

  expect(screen.getByText('group1-level-0-maxLevel-1')).toBeInTheDocument();
  expect(screen.getByText('group2-level-0-maxLevel-1')).toBeInTheDocument();
  expect(screen.getByText('group3-level-0-maxLevel-1')).toBeInTheDocument();
});

test('render form groups with their correct level and maxLevel = 2', () => {
  const Form = () => {
    return (
      <FormGroup>
        <FormGroupItem name="group1" />
        <FormGroup>
          <FormGroupItem name="group2" />
        </FormGroup>
        <FormGroup>
          <FormGroupItem name="group3" />
        </FormGroup>
        <FormGroup>
          <FormGroupItem name="group4" />
        </FormGroup>
      </FormGroup>
    );
  };

  render(<Form />);

  expect(screen.getByText('group1-level-0-maxLevel-2')).toBeInTheDocument();
  expect(screen.getByText('group2-level-1-maxLevel-2')).toBeInTheDocument();
  expect(screen.getByText('group3-level-1-maxLevel-2')).toBeInTheDocument();
  expect(screen.getByText('group4-level-1-maxLevel-2')).toBeInTheDocument();
});

test('render form groups with their correct level and maxLevel = 3', () => {
  const Form = () => {
    return (
      <FormGroup>
        <FormGroupItem name="group1" />
        <FormGroup>
          <FormGroupItem name="group2" />
        </FormGroup>
        <FormGroup>
          <FormGroupItem name="group3" />
        </FormGroup>
        <FormGroup>
          <FormGroupItem name="group4" />
          <FormGroup>
            <FormGroupItem name="group5" />
            <FormGroupItem name="group6" />
          </FormGroup>
        </FormGroup>
      </FormGroup>
    );
  };

  render(<Form />);

  expect(screen.getByText('group1-level-0-maxLevel-3')).toBeInTheDocument();
  expect(screen.getByText('group2-level-1-maxLevel-3')).toBeInTheDocument();
  expect(screen.getByText('group3-level-1-maxLevel-3')).toBeInTheDocument();
  expect(screen.getByText('group4-level-1-maxLevel-3')).toBeInTheDocument();
  expect(screen.getByText('group5-level-2-maxLevel-3')).toBeInTheDocument();
  expect(screen.getByText('group6-level-2-maxLevel-3')).toBeInTheDocument();
});

test.each(
  Array.from({ length: 10 }, (_, i) => {
    return i + 1;
  })
)(
  'render form groups with their correct level and maxLevel n = %i',
  (maxLevel) => {
    const FormGroups = () => {
      return Array.from({ length: maxLevel }, (_, i) => {
        return i;
      }).reduce(
        (acc) => {
          return <FormGroup>{acc}</FormGroup>;
        },
        <>
          <FormGroupItem name="singleGroup" />
        </>
      );
    };

    render(<FormGroups />);

    expect(
      screen.getByText(`singleGroup-level-${maxLevel - 1}-maxLevel-${maxLevel}`)
    ).toBeInTheDocument();
  }
);
