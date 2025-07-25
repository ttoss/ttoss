import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import {
  Form,
  FormFieldRadioCard,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Button } from '@ttoss/ui';

export default {
  title: 'Forms/FormFieldRadioCard',
  component: FormFieldRadioCard,
} as Meta;

const planOptions = [
  {
    value: 'basic',
    label: 'Basic Plan',
    description:
      'Perfect for small projects and personal use. Includes essential features to get you started.',
  },
  {
    value: 'pro',
    label: 'Pro Plan',
    description:
      'Ideal for growing teams and businesses. Advanced features and priority support included.',
  },
  {
    value: 'enterprise',
    label: 'Enterprise Plan',
    description:
      'Complete solution for large organizations. Custom integrations and dedicated support.',
  },
];

const subscriptionOptions = [
  {
    value: 'monthly',
    label: 'Monthly Billing',
    description:
      'Pay monthly with flexibility to cancel anytime. No long-term commitment required.',
  },
  {
    value: 'yearly',
    label: 'Annual Billing',
    description:
      'Save 20% with yearly billing. Best value for long-term users and businesses.',
  },
];

const schema = yup.object({
  plan: yup.string().required('Plan is required'),
  subscription: yup.string().required('Subscription is required'),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldRadioCard
        name="plan"
        label="Choose your plan"
        options={planOptions}
      />

      <Button sx={{ marginTop: '8' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});

const HorizontalTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldRadioCard
        name="subscription"
        label="Billing frequency"
        direction="row"
        options={subscriptionOptions}
      />

      <Button sx={{ marginTop: '8' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Horizontal = HorizontalTemplate.bind({});
