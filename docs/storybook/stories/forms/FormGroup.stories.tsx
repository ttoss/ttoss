import { Meta } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldInput,
  FormGroup,
  useFieldArray,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button } from '@ttoss/ui';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormGroup',
  component: FormGroup,
} as Meta;

export const Simple = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormGroup title="Group 1">
        <FormFieldInput name="input1" placeholder="input1" label="input1" />
        <FormFieldInput name="input2" placeholder="input2" label="input2" />
      </FormGroup>

      <FormGroup title="Group 2">
        <FormFieldInput name="input1" placeholder="input1" label="input1" />
        <FormFieldInput name="input2" placeholder="input2" label="input2" />
      </FormGroup>

      <FormGroup title="Group 3">
        <FormFieldInput name="input1" placeholder="input1" label="input1" />
        <FormFieldInput name="input2" placeholder="input2" label="input2" />
      </FormGroup>

      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const Nested = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormGroup title="Group 1">
        <FormFieldInput name="input1" placeholder="input1" label="input1" />
        <FormFieldInput name="input2" placeholder="input2" label="input2" />

        <FormGroup title="Group 1.1">
          <FormFieldInput name="input3" placeholder="input3" label="input3" />
          <FormFieldInput name="input4" placeholder="input4" label="input4" />

          <FormGroup title="Group 1.1.1" direction="row">
            <FormGroup title="Group 1.1.1.1">
              <FormFieldInput
                name="input5"
                placeholder="input5"
                label="input5"
              />
            </FormGroup>

            <FormGroup title="Group 1.1.1.2" direction="row">
              <FormFieldInput
                name="input6-1"
                placeholder="input6-1"
                label="input6-1"
              />
              <FormFieldInput
                name="input7-1"
                placeholder="input7-1"
                label="input7-1"
              />
            </FormGroup>

            <FormGroup title="Group 1.1.1.3" direction="row">
              <FormFieldInput
                name="input6-2"
                placeholder="input6-2"
                label="input6-2"
              />
              <FormFieldInput
                name="input7-2"
                placeholder="input7-2"
                label="input7-2"
              />
            </FormGroup>
          </FormGroup>

          <FormGroup title="Group 1.1.2" direction="row">
            <FormFieldInput name="input8" placeholder="input8" label="input8" />
            <FormFieldInput name="input9" placeholder="input9" label="input9" />
          </FormGroup>

          <FormFieldInput
            name="input10"
            placeholder="input10"
            label="input10"
          />
        </FormGroup>
      </FormGroup>

      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const FlexGrow = () => {
  const formMethods = useForm();

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormGroup title="Group 1" direction="row">
        <FormGroup
          title="Group 1.1 - 300px"
          sx={{
            width: 300,
          }}
        >
          <FormFieldInput name="input1" placeholder="input1" label="input1" />
          <FormFieldInput name="input2" placeholder="input2" label="input2" />
        </FormGroup>
        <FormGroup
          title="Group 1.2 - flex: 1"
          sx={{
            flex: 1,
          }}
        >
          <FormFieldInput name="input3" placeholder="input3" label="input3" />
          <FormFieldInput name="input4" placeholder="input4" label="input4" />
        </FormGroup>
      </FormGroup>

      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const ErrorMessageOnGroup = () => {
  const schema = yup.object().shape({
    array: yup
      .array()
      .of(
        yup.object().shape({
          input: yup.string().required(),
        })
      )
      .min(1)
      .default([]),
  });

  const formMethods = useForm({
    defaultValues: {
      array: [],
    },
    resolver: yupResolver(schema),
  });

  const { append, fields, remove } = useFieldArray({
    control: formMethods.control,
    name: 'array',
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormGroup title="Group Array" direction="column" name="array">
        {fields.map((field, index) => {
          return (
            <FormGroup
              title={`Group ${index + 1}`}
              key={field.id}
              direction="row"
            >
              <FormFieldInput
                name={`array[${index}].input`}
                placeholder="input"
                label="input"
              />
              <Button
                onClick={() => {
                  remove(index);
                }}
              >
                Remove
              </Button>
            </FormGroup>
          );
        })}
        <Button
          onClick={() => {
            append({ input: '' });
          }}
        >
          Add
        </Button>
      </FormGroup>
      <Button type="submit">Submit</Button>
    </Form>
  );
};
