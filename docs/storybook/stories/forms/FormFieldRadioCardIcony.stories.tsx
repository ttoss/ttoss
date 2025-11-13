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

const strategyOptions: FormRadioOption[] = [
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
    tag: { label: 'Modelo Padrão', variant: 'accent' },
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
  },
];

const strategySchema = yup.object({
  strategy: yup.string().required('Strategy is required'),
});

const StrategyTemplate: StoryFn = () => {
  const formMethods = useForm({
    mode: 'all',
    resolver: yupResolver(strategySchema),
  });

  return (
    <Form {...formMethods} onSubmit={action('onSubmit')}>
      <FormFieldRadioCardIcony
        name="strategy"
        label="Escolha uma estratégia"
        options={strategyOptions}
      />
      <Button sx={{ marginTop: '8' }} type="submit">
        Confirmar
      </Button>
    </Form>
  );
};

export const Strategies = StrategyTemplate.bind({});
