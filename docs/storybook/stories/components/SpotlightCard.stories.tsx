import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { SpotlightCard } from '@ttoss/components/SpotlightCard';
import { Button } from '@ttoss/ui';

const meta: Meta<typeof SpotlightCard> = {
  title: 'Components/SpotlightCard',
  component: SpotlightCard,
  argTypes: {
    title: { control: 'text' },
    badge: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'text' },
    firstButton: { control: 'object' },
    secondButton: { control: 'object' },
    variant: {
      control: { type: 'radio' },
      options: [
        'accent',
        'primary',
        'positive',
        'caution',
        'muted',
        'negative',
        'secondary',
      ],
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

export const Default: Story = {
  args: {
    // Branding OneClick: 'One' (Light 300) + 'Click' (Bold 700)
    title: (
      <span>
        <span style={{ fontWeight: 300 }}>One</span>
        <span style={{ fontWeight: 700 }}>Click</span>
      </span>
    ),
    badge: 'Tracking',
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
    badge: 'Clássico',
    description: 'A versão clássica do card com fundo escuro e badge verde.',
    icon: 'material-symbols:dark-mode',
  },
};

/**
 * Custom React Node
 */
export const CustomNodes: Story = {
  args: {
    ...Default.args,
    title: 'Custom Title',
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
    title: 'Information',
    badge: undefined,
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
    title: 'Tutorial',
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
    badge: 'Finance',
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

/**
 * Positive Variant
 */
export const PositiveVariant: Story = {
  args: {
    ...Default.args,
    variant: 'positive',
    title: 'Success',
    badge: 'Completed',
    description:
      'Your task has been completed successfully. All systems are operational.',
    icon: 'material-symbols:check-circle-outline',
  },
};

/**
 * Caution Variant
 */
export const CautionVariant: Story = {
  args: {
    ...Default.args,
    variant: 'caution',
    title: 'Warning',
    badge: 'Attention',
    description:
      'Please review the following items before proceeding with the action.',
    icon: 'material-symbols:warning-outline',
  },
};

/**
 * Muted Variant
 */
export const MutedVariant: Story = {
  args: {
    ...Default.args,
    variant: 'muted',
    title: 'Information',
    badge: 'Notice',
    description: 'This is a subtle notification for background information.',
    icon: 'material-symbols:info-outline',
  },
};

/**
 * Negative Variant
 */
export const NegativeVariant: Story = {
  args: {
    ...Default.args,
    variant: 'negative',
    title: 'Error',
    badge: 'Critical',
    description:
      'An error occurred while processing your request. Please try again.',
    icon: 'material-symbols:error-outline',
  },
};

/**
 * Secondary Variant
 */
export const SecondaryVariant: Story = {
  args: {
    ...Default.args,
    variant: 'secondary',
    title: 'Alternative',
    badge: 'Optional',
    description: 'This is an alternative style with secondary colors.',
    icon: 'material-symbols:category-outline',
  },
};
