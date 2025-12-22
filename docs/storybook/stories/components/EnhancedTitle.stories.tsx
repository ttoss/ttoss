import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { EnhancedTitle } from '@ttoss/components/EnhancedTitle';

const meta: Meta<typeof EnhancedTitle> = {
  title: 'Components/EnhancedTitle',
  component: EnhancedTitle,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: [
        'spotlight-accent',
        'spotlight-primary',
        'primary',
        'secondary',
        'accent',
      ],
      description: 'Visual style variant of the EnhancedTitle component',
      table: {
        defaultValue: { summary: 'spotlight-accent' },
      },
    },
    icon: {
      control: 'text',
      description: 'Icon identifier from @ttoss/react-icons',
    },
    title: {
      control: 'text',
      description: 'Main title text',
    },
    frontTitle: {
      control: 'text',
      description: 'Secondary text displayed next to the title',
    },
    description: {
      control: 'text',
      description: 'Description text below the title',
    },
    topBadges: {
      control: 'object',
      description: 'Array of badges displayed above the title',
    },
    bottomBadges: {
      control: 'object',
      description: 'Array of badges displayed below the description',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'EnhancedTitle displays structured title sections with icons, badges, and metadata. Perfect for plan cards, feature sections, and content headers.',
      },
    },
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof EnhancedTitle>;

/**
 * Default title with minimal configuration.
 */
export const Default: Story = {
  args: {
    title: 'Starter Plan',
    description: 'Perfect for small teams getting started',
  },
};

/**
 * Title with icon for visual identification.
 */
export const WithIcon: Story = {
  args: {
    icon: 'fluent:shield-24-filled',
    title: 'Premium Plan',
    description: 'Advanced features for growing businesses',
    variant: 'primary',
  },
};

/**
 * Title with price information in frontTitle.
 */
export const WithPrice: Story = {
  args: {
    icon: 'fluent:shield-24-regular',
    title: 'Pro Plan',
    frontTitle: 'R$ 99,00/mês',
    description: 'Professional features for advanced users',
    variant: 'primary',
  },
};

/**
 * Title with status badges displayed above.
 */
export const WithTopBadges: Story = {
  args: {
    icon: 'fluent:rocket-24-filled',
    title: 'Growth Plan',
    frontTitle: '$49/month',
    description: 'Scale your business with confidence',
    topBadges: [
      {
        label: 'Active',
        variant: 'positive',
        icon: 'fluent:checkmark-circle-24-filled',
      },
      { label: 'Most Popular', variant: 'informative' },
    ],
  },
};

/**
 * Title with feature badges displayed below.
 */
export const WithBottomBadges: Story = {
  args: {
    icon: 'fluent:apps-24-filled',
    title: 'Business Plan',
    frontTitle: '$199/month',
    description: 'Complete solution for businesses',
    bottomBadges: [
      { label: 'OneClick Tracking' },
      { label: 'Campaign Optimization' },
      { label: 'Priority Support' },
    ],
  },
};

/**
 * Complete example with all features enabled - similar to SubscriptionPanel usage.
 */
export const SubscriptionPlanExample: Story = {
  args: {
    variant: 'primary',
    icon: 'fluent:shield-24-filled',
    title: 'Starter Plan',
    frontTitle: 'R$ 49,90/mês',
    description:
      'Perfeito para pequenas equipes começando com rastreamento de conversões',
    topBadges: [
      {
        label: 'Ativo',
        variant: 'positive',
        icon: 'fluent:checkmark-circle-24-filled',
      },
      {
        label: 'Mensal',
        variant: 'muted',
      },
    ],
    bottomBadges: [
      {
        label: 'OneClick Tracking',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'Otimização de Campanhas',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'Até 2.500 conversões',
        icon: 'fluent:checkmark-24-filled',
      },
    ],
  },
};

/**
 * Premium subscription with warning status.
 */
export const PremiumWithWarning: Story = {
  args: {
    variant: 'accent',
    icon: 'fluent:star-24-filled',
    title: 'Premium Plan',
    frontTitle: 'R$ 99,00/mês',
    description: 'Recursos avançados com limites expandidos',
    topBadges: [
      {
        label: 'Ativo',
        variant: 'positive',
        icon: 'fluent:checkmark-circle-24-filled',
      },
      {
        label: 'Cancelamento Agendado',
        variant: 'warning',
        icon: 'fluent:warning-24-filled',
      },
    ],
    bottomBadges: [
      {
        label: 'Tracking Premium',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'Suporte 24/7',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'API Access',
        icon: 'fluent:checkmark-24-filled',
      },
    ],
  },
};

/**
 * Enterprise plan with multiple status indicators.
 */
export const EnterprisePlan: Story = {
  args: {
    variant: 'primary',
    icon: 'fluent:building-24-filled',
    title: 'Enterprise Plan',
    frontTitle: 'R$ 299,00/mês',
    description: 'Solução completa para grandes organizações',
    topBadges: [
      {
        label: 'Ativo',
        variant: 'positive',
        icon: 'fluent:checkmark-circle-24-filled',
      },
      {
        label: 'Anual',
        variant: 'informative',
      },
      {
        label: 'Atualização Agendada',
        variant: 'attention',
        icon: 'fluent:calendar-24-regular',
      },
    ],
    bottomBadges: [
      {
        label: 'Recursos Ilimitados',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'Suporte Dedicado',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'SLA Garantido',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'Custom Integration',
        icon: 'fluent:checkmark-24-filled',
      },
    ],
  },
};

/**
 * Free plan without frontTitle.
 */
export const FreePlan: Story = {
  args: {
    icon: 'fluent:gift-24-regular',
    title: 'Free Plan',
    description: 'Comece gratuitamente com recursos básicos',
    topBadges: [
      {
        label: 'Grátis para sempre',
        variant: 'positive',
        icon: 'fluent:checkmark-circle-24-filled',
      },
    ],
    bottomBadges: [
      {
        label: 'Até 100 conversões/mês',
        icon: 'fluent:checkmark-24-filled',
      },
      {
        label: 'Suporte por email',
        icon: 'fluent:checkmark-24-filled',
      },
    ],
  },
};

/**
 * Inactive subscription status.
 */
export const InactivePlan: Story = {
  args: {
    variant: 'primary',
    icon: 'fluent:shield-24-regular',
    title: 'Starter Plan',
    frontTitle: 'R$ 49,90/mês',
    description: 'Sua assinatura está inativa',
    topBadges: [
      {
        label: 'Inativo',
        variant: 'negative',
        icon: 'fluent:dismiss-circle-24-filled',
      },
    ],
  },
};
