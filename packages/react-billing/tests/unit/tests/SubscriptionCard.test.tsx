import { Icon } from '@ttoss/react-icons';
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { SubscriptionCard } from '../../../src';
import {
  getSubscriptionCardAccentBarSx,
  getSubscriptionCardHeaderIconSx,
} from '../../../src/components/subscriptionCard/SubscriptionCard.styles';
import { MetricCard } from '../../../src/components/subscriptionCard/SubscriptionCardMetricCards';

const PlanIcon = () => {
  return <Icon icon="fluent:shield-24-regular" width={24} height={24} />;
};

test('renders basic subscription card with required props', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Starter Plan"
      price={{ value: 'R$ 49,90', interval: 'mês' }}
      status={{
        status: 'active',
        interval: 'Mensal',
      }}
    />
  );

  expect(screen.getByText('Starter Plan')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s*49,90\s*\/mês/)).toBeInTheDocument();
  expect(screen.getByText('Ativo')).toBeInTheDocument();
  expect(screen.getByText('Mensal')).toBeInTheDocument();
});

test('renders features when provided', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Premium Plan"
      price={{ value: 'R$ 99,00' }}
      status={{ status: 'active' }}
      features={[
        { label: 'OneClick Tracking' },
        { label: 'Otimização de Campanhas' },
      ]}
    />
  );

  expect(screen.getByText('OneClick Tracking')).toBeInTheDocument();
  expect(screen.getByText('Otimização de Campanhas')).toBeInTheDocument();
});

test('renders action buttons when provided', () => {
  const handleClick = jest.fn();

  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Enterprise Plan"
      price={{ value: 'R$ 299,00' }}
      status={{ status: 'active' }}
      actions={[
        {
          label: 'Alterar Plano',
          onClick: handleClick,
          variant: 'secondary',
        },
        {
          label: 'Gerenciar Assinatura',
          onClick: handleClick,
          variant: 'accent',
        },
      ]}
    />
  );

  const alterButton = screen.getByRole('button', { name: 'Alterar Plano' });
  const manageButton = screen.getByRole('button', {
    name: 'Gerenciar Assinatura',
  });

  expect(alterButton).toBeInTheDocument();
  expect(manageButton).toBeInTheDocument();
});

test('renders date metric correctly', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Starter Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      metrics={[
        {
          type: 'date',
          label: 'Acesso válido até',
          date: '11/12/2026',
          remainingDaysMessage: 'Faltam 358 dias',
          icon: 'fluent:calendar-24-regular',
        },
      ]}
    />
  );

  expect(screen.getByText('Acesso válido até')).toBeInTheDocument();
  expect(screen.getByText('11/12/2026')).toBeInTheDocument();
  expect(screen.getByText('Faltam 358 dias')).toBeInTheDocument();
});

test('renders percentage metric correctly', () => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Starter Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      metrics={[
        {
          type: 'percentage',
          label: 'Conversões rastreadas',
          current: 750,
          max: 2500,
          formatValue: formatNumber,
          showAlertThreshold: 80,
          icon: 'fluent:target-24-regular',
        },
      ]}
    />
  );

  expect(screen.getByText('Conversões rastreadas')).toBeInTheDocument();
  expect(screen.getByText('750')).toBeInTheDocument();
  expect(screen.getByText(/de\s*2\.500/)).toBeInTheDocument();
});

test('renders number metric correctly', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Starter Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      metrics={[
        {
          type: 'number',
          label: 'Contas de anúncios',
          current: 2,
          max: 5,
          footerText: 'Adicione mais contas',
          icon: 'fluent:people-24-regular',
        },
      ]}
    />
  );

  expect(screen.getByText('Contas de anúncios')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText(/de\s*5/)).toBeInTheDocument();
  expect(screen.getByText('Adicione mais contas')).toBeInTheDocument();
});

test('renders different subscription statuses correctly', () => {
  const { rerender } = render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
    />
  );

  expect(screen.getByText('Ativo')).toBeInTheDocument();

  rerender(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'inactive' }}
    />
  );

  expect(screen.getByText('Inativo')).toBeInTheDocument();

  rerender(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'cancelled' }}
    />
  );

  expect(screen.getByText('Cancelado')).toBeInTheDocument();
});

test('renders different variants correctly', () => {
  const { rerender } = render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="spotlight-accent"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="spotlight-primary"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="primary"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="secondary"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="accent"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();
});

test('omits optional sections when not provided', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Minimal Plan"
      price={{ value: 'Grátis' }}
      status={{ status: 'active' }}
    />
  );

  expect(screen.getByText('Minimal Plan')).toBeInTheDocument();
  expect(screen.getByText('Grátis')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

test('renders scheduled update and cancellation badges when enabled', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Premium Plan"
      price={{ value: 'R$ 99,00', interval: 'mês' }}
      status={{
        status: 'active',
        interval: 'Mensal',
        hasScheduledUpdate: true,
        hasCancellation: true,
      }}
    />
  );

  expect(screen.getByText('Alteração Agendada')).toBeInTheDocument();
  expect(screen.getByText('Renovação Cancelada')).toBeInTheDocument();
});

test('renders loading state (skeleton) when isLoading is true', () => {
  render(
    <SubscriptionCard
      icon={<PlanIcon />}
      planName="Starter Plan"
      price={{ value: 'R$ 49,90', interval: 'mês' }}
      status={{ status: 'active' }}
      isLoading
    />
  );

  expect(screen.queryByText('Starter Plan')).toBeNull();
});

test('style helpers apply animation only for spotlight variants', () => {
  const spotlightAccent = getSubscriptionCardAccentBarSx('spotlight-accent');
  const spotlightPrimary = getSubscriptionCardAccentBarSx('spotlight-primary');
  const solidPrimary = getSubscriptionCardAccentBarSx('primary');

  expect(spotlightAccent.animation).toBeDefined();
  expect(spotlightPrimary.animation).toBeDefined();
  expect(solidPrimary.animation).toBeUndefined();

  const headerSpotlight = getSubscriptionCardHeaderIconSx('spotlight-accent');
  const headerSolid = getSubscriptionCardHeaderIconSx('secondary');

  expect(headerSpotlight.animation).toBeDefined();
  expect(headerSolid.animation).toBeUndefined();
});

test('MetricCard: tooltip function triggers handler and does not trigger card click', () => {
  const onTooltip = jest.fn();
  const onCardClick = jest.fn();

  const { container } = render(
    <MetricCard
      metric={{
        type: 'number',
        label: 'Contas de anúncios',
        current: 2,
        max: 5,
        tooltip: onTooltip,
        onClick: onCardClick,
        icon: 'fluent:people-24-regular',
      }}
    />
  );

  const tooltipIcon = container.querySelector(
    'iconify-icon[icon="fluent:info-24-regular"]'
  );

  expect(tooltipIcon).toBeTruthy();
  fireEvent.click(tooltipIcon as Element);

  expect(onTooltip).toHaveBeenCalledTimes(1);
  expect(onCardClick).toHaveBeenCalledTimes(0);
});

test('MetricCard: clickable cards render open icon and call handler on click', () => {
  const onCardClick = jest.fn();

  const { container } = render(
    <MetricCard
      metric={{
        type: 'date',
        label: 'Acesso válido até',
        date: '11/12/2026',
        onClick: onCardClick,
        icon: 'fluent:calendar-24-regular',
      }}
    />
  );

  expect(
    container.querySelector('iconify-icon[icon="fluent:open-24-regular"]')
  ).toBeTruthy();

  fireEvent.click(screen.getByText('Acesso válido até'));
  expect(onCardClick).toHaveBeenCalledTimes(1);
});

test('MetricCard: percentage max null renders unlimited state', () => {
  render(
    <MetricCard
      metric={{
        type: 'percentage',
        label: 'Uso do plano',
        current: 10,
        max: null,
      }}
    />
  );

  expect(screen.getByText('Uso do plano')).toBeInTheDocument();
  expect(screen.getByText(/de\s*∞/)).toBeInTheDocument();
  expect(screen.getByText('Ilimitado')).toBeInTheDocument();
});

test('MetricCard: percentage shows alert near limit and at limit', () => {
  const { rerender } = render(
    <MetricCard
      metric={{
        type: 'percentage',
        label: 'Uso do plano',
        current: 90,
        max: 100,
        showAlertThreshold: 80,
      }}
    />
  );

  expect(screen.getByText('Próximo do limite')).toBeInTheDocument();

  rerender(
    <MetricCard
      metric={{
        type: 'percentage',
        label: 'Uso do plano',
        current: 100,
        max: 100,
        showAlertThreshold: 80,
      }}
    />
  );

  expect(screen.getByText('Atingiu o limite')).toBeInTheDocument();
});

test('MetricCard: isLoading true renders nothing', () => {
  const { container } = render(
    <MetricCard
      isLoading
      metric={{
        type: 'date',
        label: 'Acesso válido até',
        date: '11/12/2026',
      }}
    />
  );

  expect(container).toBeEmptyDOMElement();
});
