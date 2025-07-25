import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import {
  Form,
  FormFieldRadioCardIcony,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Icon } from '@ttoss/react-icons';
import { Button } from '@ttoss/ui';

export default {
  title: 'Forms/FormFieldRadioCardIcony',
  component: FormFieldRadioCardIcony,
} as Meta;

const iconOptions = [
  {
    value: 'smile',
    label: 'Smile',
    description: 'Express happiness.',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="mdi:emoticon-outline"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
  },
  {
    value: 'star',
    label: 'Star',
    description: 'Mark as favorite.',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="mdi:star-outline"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
  },
  {
    value: 'heart',
    label: 'Heart',
    description: 'Show some love.',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="mdi:heart-outline"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
  },
];

const schema = yup.object({
  icon: yup.string().required('Icon is required'),
});

const Template: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldRadioCardIcony
        name="icon"
        label="Choose an icon"
        options={iconOptions}
      />
      <Button sx={{ marginTop: '8' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Example = Template.bind({});

const VerticalTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(schema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldRadioCardIcony
        name="icon"
        label="Choose an icon (vertical)"
        direction="column"
        options={iconOptions}
      />
      <Button sx={{ marginTop: '8' }} type="submit">
        Submit
      </Button>
    </Form>
  );
};

export const Vertical = VerticalTemplate.bind({});
