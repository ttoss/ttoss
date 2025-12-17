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
      <Text sx={{ textAlign: 'center', width: 'full' }}>{'7 days trial'}</Text>
    </Flex>
  );
};

const Header = () => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: '2' }}>
      <Text sx={{ fontSize: 'lg', color: 'display.text.primary.default' }}>
        {'Starter'}
      </Text>
      <Text sx={{ fontSize: 'sm', color: 'display.text.secondary.default' }}>
        {'For individuals getting started'}
      </Text>
    </Flex>
  );
};

const Metadata = () => {
  return (
    <Stack sx={{ gap: '2', width: 'full' }}>
      <Flex
        sx={{
          width: 'full',
          fontSize: 'sm',
          justifyContent: 'space-between',
        }}
      >
        <Text sx={{ color: 'display.text.secondary.default' }}>
          {'monthlySpendMax: '}
        </Text>
        <Text sx={{ fontWeight: 'bold' }}>{'$1,000'}</Text>
      </Flex>
      <Flex
        sx={{
          width: 'full',
          fontSize: 'sm',
          justifyContent: 'space-between',
        }}
      >
        <Text sx={{ color: 'display.text.secondary.default' }}>
          {'maxAdAccounts: '}
        </Text>
        <Text sx={{ fontWeight: 'bold' }}>{'2'}</Text>
      </Flex>
    </Stack>
  );
};

const Price = () => {
  return (
    <Flex sx={{ alignItems: 'baseline', gap: '2' }}>
      <Text
        sx={{
          fontSize: '4xl',
          fontWeight: 'bold',
          color: 'display.text.primary.default',
        }}
      >
        {'$29'}
      </Text>
      <Text sx={{ fontSize: 'sm', color: 'display.text.secondary.default' }}>
        {'/month'}
      </Text>
    </Flex>
  );
};

const Features = () => {
  return (
    <Stack sx={{ gap: '3' }}>
      <Text sx={{ fontSize: 'sm', color: 'display.text.secondary.default' }}>
        {'✓ Basic reporting'}
      </Text>
      <Text sx={{ fontSize: 'sm', color: 'display.text.secondary.default' }}>
        {'✓ 1 workspace'}
      </Text>
      <Text sx={{ fontSize: 'sm', color: 'display.text.secondary.default' }}>
        {'✓ Community support'}
      </Text>
    </Stack>
  );
};

export const Default: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <PlanCard>
          <PlanCard.Header>
            <Header />
          </PlanCard.Header>
          <PlanCard.Metadata>
            <Metadata />
          </PlanCard.Metadata>
          <PlanCard.Price>
            <Price />
          </PlanCard.Price>
          <PlanCard.Features>
            <Features />
          </PlanCard.Features>
          <PlanCard.CTA
            label={'Assine agora'}
            onClick={() => {
              // story action placeholder
            }}
          />
        </PlanCard>
      </Box>
    );
  },
};

export const WithTopTag: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <PlanCard>
          <PlanCard.TopTag>
            <TopTag />
          </PlanCard.TopTag>
          <PlanCard.Header>
            <Header />
          </PlanCard.Header>
          <PlanCard.Metadata>
            <Metadata />
          </PlanCard.Metadata>
          <PlanCard.Price>
            <Price />
          </PlanCard.Price>
          <PlanCard.Features>
            <Features />
          </PlanCard.Features>
          <PlanCard.CTA label={'Assine agora'} />
        </PlanCard>
      </Box>
    );
  },
};

export const CustomCTA: Story = {
  render: () => {
    return (
      <Box sx={{ padding: '4' }}>
        <PlanCard>
          <PlanCard.Header>
            <Header />
          </PlanCard.Header>
          <PlanCard.Metadata>
            <Metadata />
          </PlanCard.Metadata>
          <PlanCard.Price>
            <Price />
          </PlanCard.Price>
          <PlanCard.Features>
            <Features />
          </PlanCard.Features>
          <PlanCard.CTA
            label={'Upgrade now'}
            leftIcon={'fluent:card-ui-20-filled'}
            containerProps={{ sx: { paddingTop: '10' } }}
            variant="primary"
          />
        </PlanCard>
      </Box>
    );
  },
};
