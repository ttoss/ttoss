import { Meta, StoryObj } from '@storybook/react-webpack5';
import { SpotlightCard } from '@ttoss/components/SpotlightCard';
import { Button } from '@ttoss/ui';

const meta: Meta<typeof SpotlightCard> = {
  title: 'Components/SpotlightCard',
  component: SpotlightCard,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'text' },
    firstButton: { control: 'object' },
    secondButton: { control: 'object' },
    variant: {
      control: { type: 'radio' },
      options: ['accent', 'primary'],
      description: 'Estilo visual do card',
      table: {
        defaultValue: { summary: 'accent' },
      },
    },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightCard>;

/**
 * Default Story (Accent)
 */
export const Default: Story = {
  args: {
    title: 'OneClick',
    subtitle: 'Tracking',
    description:
      'Entenda para que serve e como utilizar o OneClick Tracking para maximizar o rastreamento das suas conversões.',
    icon: 'material-symbols:ads-click',
    variant: 'accent',
    firstButton: {
      children: 'Assistir Tutorial',
      leftIcon: 'material-symbols:play-circle-outline',
      onClick: () => {
        return alert('Primary Clicked');
      },
    },
    secondButton: {
      children: 'Ler Artigo',
      leftIcon: 'material-symbols:menu-book-outline',
      onClick: () => {
        return alert('Secondary Clicked');
      },
    },
  },
};

/**
 * Primary Variant
 */
export const PrimaryVariant: Story = {
  args: {
    ...Default.args,
    variant: 'primary',
    title: 'Modo Escuro',
    subtitle: 'Clássico',
    description: 'A versão clássica do card com fundo escuro.',
    icon: 'material-symbols:dark-mode',
  },
};

/**
 * Custom React Node
 */
export const CustomNodes: Story = {
  args: {
    ...Default.args,
    firstButton: (
      <div
        style={{
          background: 'white',
          color: '#111827',
          padding: '10px 20px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Custom Div
      </div>
    ),
    secondButton: <Button variant="destructive">Destructive Button</Button>,
  },
};

/**
 * No Buttons
 */
export const NoButtons: Story = {
  args: {
    ...Default.args,
    description:
      'This banner serves only as information or a highlight without direct actions available at the moment.',
    firstButton: undefined,
    secondButton: undefined,
  },
};

/**
 * Only First Button
 */
export const OnlyFirstButton: Story = {
  args: {
    ...Default.args,
    firstButton: {
      children: 'Watch Tutorial',
      leftIcon: 'material-symbols:play-circle-outline',
      onClick: () => {
        return alert('Clicked');
      },
    },
    secondButton: undefined,
  },
};

/**
 * Finance Context
 */
export const FinanceDashboardContext: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Finance',
    description:
      'Track your earnings and dividends in real time with advanced charts and insights.',
    icon: 'material-symbols:attach-money',
    firstButton: {
      children: 'View Demo',
    },
    secondButton: {
      children: 'Documentation',
    },
  },
};
