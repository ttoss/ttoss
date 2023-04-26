import { Button } from '@ttoss/ui';
import { Form, FormFieldInput, FormGroup, useForm } from '@ttoss/forms/src';
import { Meta, StoryFn } from '@storybook/react';
import { action } from '@storybook/addon-actions';

export default {
  title: 'Forms/FormGroup',
  component: FormGroup,
} as Meta;

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormGroup>
        <FormFieldInput name="input1" placeholder="input1" label="input1" />
        <FormFieldInput name="input2" placeholder="input2" label="input2" />

        <FormGroup>
          <FormFieldInput name="input3" placeholder="input3" label="input3" />
          <FormFieldInput name="input4" placeholder="input4" label="input4" />

          <FormGroup direction="row">
            <FormFieldInput name="input5" placeholder="input5" label="input5" />

            <FormGroup direction="row">
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

            <FormGroup direction="row">
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

          <FormGroup direction="row">
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

export const Example = Template.bind({});
