import { render, screen } from '@ttoss/test-utils/react';

import { SubscriptionPanel } from '../../../src';
import {
  getSubscriptionPanelAccentBarSx,
  getSubscriptionPanelHeaderIconSx,
} from '../../../src/components/subscriptionPanel/SubscriptionPanel.styles';
import { SubscriptionPanelActionsSlot } from '../../../src/components/subscriptionPanel/SubscriptionPanelActionsSlot';

jest.mock('@ttoss/components/MetricCard', () => {
  const MetricCard = ({ metric }: { metric: { label?: string } }) => {
    return <div data-testid="metric-card">{metric?.label}</div>;
  };

  return { MetricCard };
});

test('renders basic subscription card with required props', () => {
  render(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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

test('renders metrics section when provided', () => {
  render(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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
        {
          type: 'percentage',
          label: 'Conversões rastreadas',
          current: 750,
          max: 2500,
          showAlertThreshold: 80,
          icon: 'fluent:target-24-regular',
        },
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

  expect(screen.getByText('Acesso válido até')).toBeInTheDocument();
  expect(screen.getByText('Conversões rastreadas')).toBeInTheDocument();
  expect(screen.getByText('Contas de anúncios')).toBeInTheDocument();
  expect(screen.getAllByTestId('metric-card')).toHaveLength(3);
});

test('renders different subscription statuses correctly', () => {
  const { rerender } = render(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
    />
  );

  expect(screen.getByText('Ativo')).toBeInTheDocument();

  rerender(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'inactive' }}
    />
  );

  expect(screen.getByText('Inativo')).toBeInTheDocument();

  rerender(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'cancelled' }}
    />
  );

  expect(screen.getByText('Cancelado')).toBeInTheDocument();
});

test('renders different variants correctly', () => {
  const { rerender } = render(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="spotlight-accent"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="spotlight-primary"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="primary"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Test Plan"
      price={{ value: 'R$ 49,90' }}
      status={{ status: 'active' }}
      variant="secondary"
    />
  );

  expect(screen.getByText('Test Plan')).toBeInTheDocument();

  rerender(
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
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
    <SubscriptionPanel
      icon={'fluent:shield-24-regular'}
      planName="Starter Plan"
      price={{ value: 'R$ 49,90', interval: 'mês' }}
      status={{ status: 'active' }}
      isLoading
    />
  );

  expect(screen.queryByText('Starter Plan')).toBeNull();
});

test('style helpers apply animation only for spotlight variants', () => {
  const spotlightAccent = getSubscriptionPanelAccentBarSx('spotlight-accent');
  const spotlightPrimary = getSubscriptionPanelAccentBarSx('spotlight-primary');
  const solidPrimary = getSubscriptionPanelAccentBarSx('primary');

  expect(spotlightAccent.animation).toBeDefined();
  expect(spotlightPrimary.animation).toBeDefined();
  expect(solidPrimary.animation).toBeUndefined();

  const headerSpotlight = getSubscriptionPanelHeaderIconSx('spotlight-accent');
  const headerSolid = getSubscriptionPanelHeaderIconSx('secondary');

  expect(headerSpotlight.animation).toBeDefined();
  expect(headerSolid.animation).toBeUndefined();
});

test('style helpers generate gradient backgrounds when theme provides colors', () => {
  const accent = getSubscriptionPanelAccentBarSx('spotlight-accent');

  expect(typeof accent.background).toBe('function');
  const accentBg = (
    accent.background as unknown as (t: unknown) => string | undefined
  )({
    colors: {
      action: {
        background: {
          accent: { default: '#111', active: '#222' },
        },
      },
    },
  });

  expect(accentBg).toContain('#111');
  expect(accentBg).toContain('#222');

  const primary = getSubscriptionPanelHeaderIconSx('spotlight-primary');
  expect(typeof primary.background).toBe('function');

  const primaryBg = (
    primary.background as unknown as (t: unknown) => string | undefined
  )({
    colors: {
      action: {
        background: {
          primary: { default: '#0a0a0a' },
          secondary: { default: '#0b0b0b' },
        },
      },
    },
  });

  expect(primaryBg).toContain('#0a0a0a');
  expect(primaryBg).toContain('#0b0b0b');
});

test('SubscriptionPanelActionsSlot returns null when actions is empty', () => {
  const { container } = render(<SubscriptionPanelActionsSlot actions={[]} />);
  expect(container).toBeEmptyDOMElement();
});

test('SubscriptionPanelActionsSlot renders loading action state', () => {
  render(
    <SubscriptionPanelActionsSlot
      actions={[
        {
          label: 'Gerenciar',
          onClick: jest.fn(),
          isLoading: true,
        },
      ]}
    />
  );

  expect(screen.getByText('Processando...')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeDisabled();
});
