import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { PlanCard } from '@ttoss/react-billing';
import { Box, Flex, Stack, Text } from '@ttoss/ui';

const meta: Meta<typeof PlanCard> = {
  title: 'React Billing/PlanCard',
  component: PlanCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PlanCard>;

const topTagLabel = '7 days trial';
const starterTitle = 'Starter';
const starterSubtitle = 'For individuals getting started';
const billedMonthly = 'Billed monthly';
const ctaSubscribeNow = 'Assine agora';
const ctaUpgradeNow = 'Upgrade now';

const TopTag = () => {
  return (
    <Flex
      sx={{
        paddingX: '4',
        paddingY: '2',
        backgroundColor: 'feedback.background.positive.default',
        borderRadius: 'lg',
      }}
    >
      <Text sx={{ textAlign: 'center', width: 'full' }}>{topTagLabel}</Text>
    </Flex>
  );
};

const features = ['Basic reporting', 'workspace', 'Community support'];

export const Default: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <PlanCard
          title={starterTitle}
          subtitle={starterSubtitle}
          metadata={[
            {
              id: 'OPTIMIZATION',
              label: 'Otimização de Campanhas',
              icon: 'fluent:arrow-trending-24-filled',
              parameters: [
                { name: 'Limite de Investimento Mensal', value: 'R$ 1.000' },
                { name: 'Número Máximo de Contas de Anúncios', value: '2' },
              ],
            },
          ]}
          price={{
            value: (249.75).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            interval: `/conta de anúncios/mês`,
            description: 'Total de R$ 2.997,00/ano',
          }}
          features={features}
          buttonProps={{
            label: ctaSubscribeNow,
            onClick: () => {
              // story action placeholder
            },
          }}
        />
      </Box>
    );
  },
};

export const WithTopTag: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <Stack sx={{ gap: '4' }}>
          <PlanCard
            topTag={<TopTag />}
            title={starterTitle}
            subtitle={starterSubtitle}
            metadata={[
              {
                id: 'OPTIMIZATION',
                label: 'Otimização de Campanhas',
                icon: 'fluent:arrow-trending-24-filled',
                parameters: [
                  { name: 'Limite de Investimento Mensal', value: 'R$ 1.000' },
                ],
              },
            ]}
            price={{
              value: 'R$29',
              interval: '/month',
              description: billedMonthly,
            }}
            features={features}
            buttonProps={{ label: ctaSubscribeNow }}
          />
        </Stack>
      </Box>
    );
  },
};

export const CustomCTA: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <PlanCard
          title={starterTitle}
          subtitle={starterSubtitle}
          metadata={[
            {
              id: 'OPTIMIZATION',
              label: 'Otimização de Campanhas',
              icon: 'fluent:arrow-trending-24-filled',
              parameters: [
                { name: 'Limite de Investimento Mensal', value: 'R$ 1.000' },
              ],
            },
          ]}
          price={{ value: 'R$ 29', interval: '/month' }}
          features={features}
          buttonProps={{
            label: ctaUpgradeNow,
            leftIcon: 'fluent:card-ui-20-filled',
            variant: 'primary',
            sx: { marginTop: '10' },
          }}
        />
      </Box>
    );
  },
};

export const EnterpriseExample: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <PlanCard
          variant="secondary"
          title={'Enterprise'}
          subtitle={'For large businesses'}
          metadata={[
            {
              id: 'OPTIMIZATION',
              label: 'Otimização de Campanhas',
              icon: 'fluent:arrow-trending-24-filled',
              parameters: [
                {
                  name: 'Limite de Investimento Mensal',
                  value: 'Fale conosco',
                },
              ],
            },
            {
              id: 'TRACKING',
              label: 'OneClick Tracking',
              icon: 'fluent:arrow-trending-24-filled',
              parameters: [
                {
                  name: 'Limite de Conversões Rastreáveis',
                  value: 'Fale conosco',
                },
              ],
            },
          ]}
          price={{
            value: 'Sob medida',
            interval: '',
            description: 'Solicite um orçamento',
          }}
          features={features}
          buttonProps={{
            label: ctaUpgradeNow,
            leftIcon: 'fluent:card-ui-20-filled',
          }}
        />
      </Box>
    );
  },
};
