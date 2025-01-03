import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import {
  Form,
  FormFieldCheckbox,
  FormFieldInput,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button, Stack } from '@ttoss/ui';

export default {
  title: 'Forms/FormFieldCheckbox',
  component: FormFieldCheckbox,
} as Meta;

const optimizationSchema = yup.object({
  name: yup.string().required('Name is required'),
  isActivated: yup.boolean().default(false),
});

const OptimizationCard = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(optimizationSchema),
  });

  const onSubmit = (data: unknown) => {
    action('onSubmit')(data);
  };

  return (
    <Form {...formMethods} onSubmit={onSubmit}>
      <FormFieldInput name="name" label="Name" />
      <FormFieldCheckbox name="isActivated" label="Is activated?" />
      <Button sx={{ marginTop: '4' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const MultiplesCheckboxes: StoryFn = () => {
  return (
    <Stack>
      <OptimizationCard />
      <OptimizationCard />
      <OptimizationCard />
    </Stack>
  );
};
