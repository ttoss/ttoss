import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { SubscriptionCard } from '@ttoss/react-billing';
import { Icon } from '@ttoss/react-icons';
import { Box } from '@ttoss/ui';

const meta: Meta<typeof SubscriptionCard> = {
  title: 'React Billing/SubscriptionCard',
  component: SubscriptionCard,
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
      description: 'Visual style variant of the subscription card',
      table: {
        defaultValue: { summary: 'spotlight-accent' },
      },
    },
    planName: { control: 'text' },
    icon: { control: false },
    price: { control: 'object' },
    status: { control: 'object' },
    features: { control: 'object' },
    actions: { control: 'object' },
    metrics: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'SubscriptionCard displays comprehensive subscription information including plan details, status, actions, and various metrics.',
      },
    },
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof SubscriptionCard>;

// Format helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Default icon for subscription cards
const PlanIcon = () => {
  return <Icon icon="fluent:shield-24-regular" width={24} height={24} />;
};

/**
 * Default subscription card showing an active subscription with all metric types.
 * Use the controls to change the variant and see different visual styles.
 */
export const Default: Story = {
  args: {
    variant: 'spotlight-accent',
    icon: <PlanIcon />,
    planName: 'Starter Plan',
    price: { value: 'R$ 49,90', interval: 'mês' },
    status: {
      status: 'active',
      interval: 'Mensal',
    },
    features: [
      { label: 'OneClick Tracking' },
      { label: 'Otimização de Campanhas' },
    ],
    actions: [
      {
        label: 'Alterar Plano',
        onClick: () => {},
        variant: 'secondary',
        leftIcon: 'fluent:arrow-swap-24-regular',
      },
      {
        label: 'Gerenciar Assinatura',
        onClick: () => {},
        variant: 'accent',
        leftIcon: 'fluent:settings-24-regular',
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
        current: 750,
        max: 2500,
        formatValue: formatNumber,
        showAlertThreshold: 80,
        icon: 'fluent:target-24-regular',
      },
      {
        type: 'number',
        label: 'Contas de anúncios',
        tooltip: 'Quantidade de contas de anúncios conectadas à sua assinatura',
        current: 2,
        max: 5,
        footerText: 'Adicione mais contas para expandir seu alcance',
        icon: 'fluent:people-24-regular',
      },
      {
        type: 'percentage',
        label: 'Limite de investimento',
        tooltip: 'Valor total que você pode investir em anúncios neste período',
        current: 2500,
        max: 5000,
        formatValue: formatCurrency,
        showAlertThreshold: 80,
        icon: 'fluent:arrow-trending-24-regular',
      },
    ],
  },
};

/**
 * Active subscription with pending cancellation scheduled.
 */
export const WithCancellationPending: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Premium Plan"
          price={{ value: 'R$ 99,00', interval: 'mês' }}
          status={{
            status: 'active',
            interval: 'Mensal',
            hasCancellation: true,
          }}
          features={[{ label: 'Tracking Premium' }, { label: 'Suporte 24/7' }]}
          actions={[
            {
              label: 'Reativar Assinatura',
              onClick: () => {},
              variant: 'accent',
            },
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Acesso válido até',
              date: '15/01/2025',
              remainingDaysMessage: 'Faltam 28 dias',
              isWarning: true,
              icon: 'fluent:calendar-24-regular',
            },
            {
              type: 'percentage',
              label: 'Uso do plano',
              current: 1800,
              max: 2500,
              formatValue: formatNumber,
              showAlertThreshold: 70,
              icon: 'fluent:data-usage-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * Subscription with scheduled plan update.
 */
export const WithScheduledUpdate: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Enterprise Plan"
          price={{ value: 'R$ 299,00', interval: 'mês' }}
          status={{
            status: 'active',
            interval: 'Mensal',
            hasScheduledUpdate: true,
          }}
          features={[
            { label: 'Recursos ilimitados' },
            { label: 'Suporte dedicado' },
            { label: 'API Access' },
          ]}
          actions={[
            {
              label: 'Ver alterações agendadas',
              onClick: () => {},
              variant: 'secondary',
            },
            {
              label: 'Cancelar alteração',
              onClick: () => {},
              variant: 'destructive',
              leftIcon: 'fluent:dismiss-24-regular',
            },
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Próxima cobrança',
              date: '15/01/2025',
              remainingDaysMessage: 'Faltam 28 dias',
              icon: 'fluent:calendar-24-regular',
            },
            {
              type: 'number',
              label: 'Contas ativas',
              current: 8,
              max: null,
              footerText: 'Sem limite de contas',
              icon: 'fluent:people-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * High usage scenario with emergency and exceed status metrics.
 */
export const HighUsage: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Starter Plan - Uso Elevado"
          price={{ value: 'R$ 49,90', interval: 'mês' }}
          status={{
            status: 'active',
            interval: 'Mensal',
          }}
          features={[{ label: 'OneClick Tracking' }]}
          actions={[
            {
              label: 'Fazer Upgrade',
              onClick: () => {},
              variant: 'accent',
              leftIcon: 'fluent:arrow-up-24-regular',
            },
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Próxima cobrança',
              date: '15/01/2025',
              remainingDaysMessage: 'Faltam 28 dias',
              icon: 'fluent:calendar-24-regular',
            },
            {
              type: 'percentage',
              label: 'Conversões rastreadas',
              tooltip: 'Você está próximo do limite de conversões',
              current: 2300,
              max: 2500,
              formatValue: formatNumber,
              showAlertThreshold: 80,
              icon: 'fluent:target-24-regular',
            },
            {
              type: 'number',
              label: 'Contas de anúncios',
              current: 5,
              max: 5,
              footerText: 'Limite atingido',
              icon: 'fluent:people-24-regular',
            },
            {
              type: 'percentage',
              label: 'Limite de investimento',
              tooltip: 'ATENÇÃO: Você ultrapassou seu limite de investimento!',
              current: 11500,
              max: 10000,
              formatValue: formatCurrency,
              showAlertThreshold: 80,
              icon: 'fluent:arrow-trending-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * Inactive subscription status.
 */
export const InactiveSubscription: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Plano Básico"
          price={{ value: 'R$ 29,00', interval: 'mês' }}
          status={{
            status: 'inactive',
          }}
          actions={[
            {
              label: 'Reativar Assinatura',
              onClick: () => {},
              variant: 'accent',
            },
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Expirou em',
              date: '01/12/2024',
              remainingDaysMessage: 'Expirado há 18 dias',
              isWarning: true,
              icon: 'fluent:calendar-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * Cancelled subscription status.
 */
export const CancelledSubscription: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Premium Plan"
          price={{ value: 'R$ 99,00', interval: 'mês' }}
          status={{
            status: 'cancelled',
          }}
          actions={[
            {
              label: 'Assinar Novamente',
              onClick: () => {},
              variant: 'accent',
            },
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Cancelado em',
              date: '15/11/2024',
              icon: 'fluent:calendar-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * Action buttons with loading state.
 */
export const ActionLoading: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Starter Plan"
          price={{ value: 'R$ 49,90', interval: 'mês' }}
          status={{
            status: 'active',
            interval: 'Mensal',
          }}
          actions={[
            {
              label: 'Processando...',
              onClick: () => {},
              variant: 'accent',
              isLoading: true,
            },
            {
              label: 'Cancelar',
              onClick: () => {},
              variant: 'secondary',
              disabled: true,
            },
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Próxima cobrança',
              date: '15/01/2025',
              icon: 'fluent:calendar-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * Clickable metric cards.
 */
export const ClickableMetrics: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Premium Plan"
          price={{ value: 'R$ 99,00', interval: 'mês' }}
          status={{
            status: 'active',
            interval: 'Mensal',
          }}
          metrics={[
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
              formatValue: formatNumber,
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
          ]}
        />
      </Box>
    );
  },
};

/**
 * Minimal subscription card without metrics.
 */
export const MinimalWithoutMetrics: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Free Plan"
          price={{ value: 'Grátis' }}
          status={{
            status: 'active',
          }}
          features={[{ label: 'Recursos básicos' }]}
          actions={[
            {
              label: 'Fazer Upgrade',
              onClick: () => {},
              variant: 'accent',
            },
          ]}
        />
      </Box>
    );
  },
};

/**
 * Annual subscription example.
 */
export const AnnualSubscription: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <SubscriptionCard
          icon={<PlanIcon />}
          planName="Starter Anual"
          price={{ value: 'R$ 5,00', interval: 'ano' }}
          status={{
            status: 'active',
            interval: 'Anual',
          }}
          features={[
            { label: 'OneClick Tracking' },
            { label: 'Otimização de Campanhas' },
          ]}
          actions={[
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
          ]}
          metrics={[
            {
              type: 'date',
              label: 'Acesso válido até',
              tooltip:
                'Data em que sua assinatura expira e precisa ser renovada',
              date: '11/12/2026',
              remainingDaysMessage: 'Faltam 358 dias',
              icon: 'fluent:calendar-24-regular',
            },
            {
              type: 'percentage',
              label: 'Conversões rastreadas',
              tooltip:
                'Número de conversões que você já rastreou neste período',
              current: 0,
              max: 2500,
              formatValue: formatNumber,
              showAlertThreshold: 80,
              icon: 'fluent:target-24-regular',
            },
            {
              type: 'number',
              label: 'Contas de anúncios',
              tooltip: () => {
                // eslint-disable-next-line no-console
                console.log('Abrindo artigo de ajuda sobre contas');
              },
              current: 2,
              max: null,
              footerText: 'Adicione mais contas para expandir seu alcance',
              icon: 'fluent:people-24-regular',
            },
            {
              type: 'percentage',
              label: 'Limite de investimento',
              tooltip:
                'Valor total que você pode investir em anúncios neste período',
              current: 4200,
              max: 5000,
              formatValue: formatCurrency,
              showAlertThreshold: 80,
              icon: 'fluent:arrow-trending-24-regular',
            },
          ]}
        />
      </Box>
    );
  },
};
