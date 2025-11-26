import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Button, SpotlightCard } from '@ttoss/ui';

const meta: Meta<typeof SpotlightCard> = {
  title: 'UI/SpotlightCard',
  component: SpotlightCard,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    description: { control: 'text' },
    firstButton: { control: 'object' },
    secondButton: { control: 'object' },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightCard>;

/**
 * Default Story: Using objects (ButtonProps) to configure the buttons.
 * UPDATE: We now use 'leftIcon' prop instead of embedding <Icon /> manually.
 */
export const Default: Story = {
  args: {
    title: 'OneClick',
    subtitle: 'Tracking',
    description:
      'Entenda para que serve e como utilizar o OneClick Tracking para maximizar o rastreamento das suas conversões.',
    iconSymbol: 'material-symbols:ads-click',
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
 * Custom React Node: Passing a fully custom component
 * instead of the default button props.
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
 * Variation with NO buttons.
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
 * Variation with ONLY First button.
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
 * Example of another context (Finance Dashboard).
 */
export const FinanceDashboardContext: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Finance',
    description:
      'Track your earnings and dividends in real time with advanced charts and insights.',
    iconSymbol: 'material-symbols:attach-money',
    firstButton: {
      children: 'View Demo',
    },
    secondButton: {
      children: 'Documentation',
    },
  },
};
