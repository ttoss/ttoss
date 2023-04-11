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
        <FormFieldInput name="input1" label="input1" />
        <FormFieldInput name="input2" label="input2" />

        <FormGroup>
          <FormFieldInput name="input3" label="input3" />
          <FormFieldInput name="input4" label="input4" />
        </FormGroup>
      </FormGroup>

      <Button type="submit">Submit</Button>
    </Form>
  );
};

export const Example = Template.bind({});
