import { Meta, StoryFn } from '@storybook/react-webpack5';
import {
  Form,
  FormFieldRadioCardIcony,
  type FormRadioOption,
  useForm,
  yup,
  yupResolver,
} from '@ttoss/forms';
import { Icon } from '@ttoss/react-icons';
import { Button } from '@ttoss/ui';
import { action } from 'storybook/actions';

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

const TagsOptions: FormRadioOption[] = [
  {
    value: 'max-performance',
    label: 'Max Performance',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:target-24-filled"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'accent', variant: 'accent' },
  },
  {
    value: 'conservative',
    label: 'Conservador',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:shield-checkmark-24-regular"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'positive', variant: 'positive' },
  },
  {
    value: 'max-scale',
    label: 'Max Escala',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:arrow-flow-diagonal-up-right-24-filled"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'muted', variant: 'muted' },
  },
  {
    value: 'flexible',
    label: 'Flexível',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:branch-compare-24-filled"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'caution', variant: 'caution' },
  },
  {
    value: 'balanced',
    label: 'Balanceado',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="mdi:scale-balance"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'negative', variant: 'negative' },
  },
  {
    value: 'custom',
    label: 'Customizado',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:settings-24-regular"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'primary', variant: 'primary' },
  },
  {
    value: 'automatic',
    label: 'Automático',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:auto-fit-height-24-regular"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'secondary', variant: 'secondary' },
  },
  {
    value: 'standard',
    label: 'Padrão',
    icon: (props: { size?: number; className?: string }) => {
      return (
        <Icon
          icon="fluent:checkbox-checked-24-regular"
          width={props.size || 24}
          className={props.className}
        />
      );
    },
    tag: { label: 'default', variant: 'default' },
  },
];

const TagsSchema = yup.object({
  strategy: yup.string().required('Strategy is required'),
});

const TagsTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(TagsSchema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldRadioCardIcony
        name="strategy"
        label="Escolha uma estratégia"
        options={TagsOptions}
      />
      <Button sx={{ marginTop: '8' }} type="submit">
        Confirmar
      </Button>
    </Form>
  );
};

export const Tags = TagsTemplate.bind({});
