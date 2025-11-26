import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Icon } from '@ttoss/react-icons';
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
 * This keeps the default style defined inside the component.
 */
export const Default: Story = {
  args: {
    title: 'OneClick',
    subtitle: 'Tracking',
    description:
      'Entenda para que serve e como utilizar o OneClick Tracking para maximizar o rastreamento das suas conversões.',
    iconSymbol: 'material-symbols:ads-click',
    firstButton: {
      children: (
        <>
          <Icon icon="material-symbols:play-circle-outline" width={18} />
          Watch Tutorial
        </>
      ),
      onClick: () => {
        return alert('Primary Clicked');
      },
    },
    secondButton: {
      children: (
        <>
          <Icon icon="material-symbols:menu-book-outline" width={18} />
          Read Article
        </>
      ),
      onClick: () => {
        return alert('Secondary Clicked');
      },
    },
  },
};

/**
 * Custom React Node: Passing a fully custom component
 * instead of the default button.
 */
export const CustomNodes: Story = {
  args: {
    ...Default.args,
    firstButton: (
      <div
        style={{
          background: 'white',
          color: 'black',
          padding: '10px',
          borderRadius: '4px',
        }}
      >
        Custom Div
      </div>
    ),
    secondButton: <Button variant="danger">Danger Button</Button>,
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
      'Track your earnings and dividends in real time with advanced charts.',
    iconSymbol: 'material-symbols:attach-money',
    firstButton: {
      children: 'View Demo',
    },
    secondButton: {
      children: 'Documentation',
    },
  },
};
