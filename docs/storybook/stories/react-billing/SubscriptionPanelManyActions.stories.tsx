import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { SubscriptionPanel } from '@ttoss/react-billing';

const meta: Meta<typeof SubscriptionPanel> = {
  title: 'React Billing/SubscriptionPanel',
  component: SubscriptionPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof SubscriptionPanel>;

/**
 * Annual subscription example.
 */
export const AnnualSubscription: Story = {
  args: {
    variant: 'accent',
    icon: 'fluent:shield-24-regular',
    planName: 'Starter Anual',
    price: { value: 'R$ 5,00', interval: 'ano' },
    status: {
      status: 'active',
      interval: 'Anual',
    },
    features: [
      { label: 'OneClick Tracking' },
      { label: 'Otimização de Campanhas' },
    ],
    actions: [
      {
        label: 'Alteração de Plano',
        onClick: () => {},
        variant: 'secondary',
        leftIcon: 'fluent:arrow-sync-24-regular',
      },
      {
        label: 'Gerenciar Assinatura',
        onClick: () => {},
        variant: 'accent',
        leftIcon: 'fluent:arrow-right-24-regular',
      },
    ],
    metrics: [
      {
        type: 'date',
        label: 'Acesso válido até',
        tooltip: 'Data em que sua assinatura expira e precisa ser renovada',
        date: '11/12/2026',
        remainingDaysMessage: 'Faltam 358 dias',
        icon: 'fluent:calendar-24-regular',
      },
      {
        type: 'percentage',
        label: 'Conversões rastreadas',
        tooltip: 'Número de conversões que você já rastreou neste período',
        current: 0,
        max: 2500,
        formatValue: (value: number) => {
          return new Intl.NumberFormat('pt-BR').format(value);
        },
        showAlertThreshold: 80,
        icon: 'fluent:target-24-regular',
      },
    ],
  },
};

/**
 * Clickable metric cards.
 */
export const ClickableMetrics: Story = {
  args: {
    variant: 'primary',
    icon: 'fluent:shield-24-regular',
    planName: 'Premium Plan',
    price: { value: 'R$ 99,00', interval: 'mês' },
    status: { status: 'active', interval: 'Mensal' },
    features: [],
    actions: undefined,
    metrics: [
      {
        type: 'date',
        label: 'Acesso válido até',
        tooltip: 'Clique para ver detalhes da renovação',
        date: '11/12/2026',
        remainingDaysMessage: 'Faltam 358 dias',
        icon: 'fluent:calendar-24-regular',
        onClick: () => {
          alert('Clicou em: Acesso válido até');
        },
      },
      {
        type: 'percentage',
        label: 'Conversões rastreadas',
        tooltip: 'Clique para ver relatório de conversões',
        current: 1250,
        max: 2500,
        formatValue: (value: number) => {
          return new Intl.NumberFormat('pt-BR').format(value);
        },
        icon: 'fluent:target-24-regular',
        onClick: () => {
          alert('Clicou em: Conversões rastreadas');
        },
      },
      {
        type: 'number',
        label: 'Contas de anúncios',
        tooltip: 'Clique para gerenciar contas',
        current: 3,
        max: 10,
        icon: 'fluent:people-24-regular',
        helpArticleAction: () => {
          alert('Abrindo artigo de ajuda sobre contas');
        },
      },
    ],
  },
};

/**
 * Subscription with four action buttons to demonstrate flexWrap behavior.
 * Buttons wrap gracefully instead of overflowing the card width.
 */
export const ManyActions: Story = {
  args: {
    variant: 'spotlight-accent',
    icon: 'fluent:shield-24-regular',
    planName: 'Starter Giovane Test Tracking',
    price: { value: 'R$ 5,00', interval: 'ano' },
    status: {
      status: 'active',
      interval: 'Anual',
      hasCancellation: true,
    },
    features: [{ label: 'Otimizações' }, { label: 'OneClick Tracking' }],
    actions: [
      {
        label: 'Alteração de Plano',
        onClick: () => {},
        variant: 'accent',
        leftIcon: 'fluent:arrow-sync-24-regular',
      },
      {
        label: 'Gerenciar Assinatura',
        onClick: () => {},
        variant: 'secondary',
        leftIcon: 'fluent:arrow-right-24-regular',
      },
      {
        label: 'Alterar Método de Pagamento',
        onClick: () => {},
        variant: 'secondary',
        leftIcon: 'fluent:payment-24-regular',
      },
      {
        label: 'Cancelar Assinatura',
        onClick: () => {},
        variant: 'secondary',
      },
    ],
  },
};
