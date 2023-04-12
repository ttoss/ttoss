import { Button } from '@ttoss/ui';
import { Form, FormFieldInput, FormGroup } from '@ttoss/forms/src';
import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useForm } from 'react-hook-form';

export default {
  title: 'Forms/FormGroup',
  component: FormGroup,
} as Meta;

const Template: Story = () => {
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

          <FormGroup>
            <FormFieldInput name="input5" placeholder="input5" label="input5" />

            <FormGroup>
              <FormFieldInput
                name="input6"
                placeholder="input6"
                label="input6"
              />
              <FormGroup>
                <FormFieldInput
                  name="input9"
                  placeholder="input9"
                  label="input9"
                />
              </FormGroup>
            </FormGroup>
          </FormGroup>

          <FormGroup>
            <FormFieldInput name="input7" placeholder="input7" label="input7" />
            <FormFieldInput name="input8" placeholder="input8" label="input8" />
          </FormGroup>
        </FormGroup>
      </FormGroup>

      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const Example = Template.bind({});
