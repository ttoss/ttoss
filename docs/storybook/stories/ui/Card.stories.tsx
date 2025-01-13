import { Meta, StoryFn } from '@storybook/react';
import { Card, CardProps, Flex, Text } from '@ttoss/ui';

export default {
  title: 'UI/Card',
  component: Card,
} as Meta;

const infos = [
  ['Objetivo', 'Leads'],
  ['Status', 'Active'],
  ['Orçamento', 'CBO'],
];

const CampaignInfoData = () => {
  return (
    <Flex sx={{ gap: '10' }}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '2',
          fontSize: 'sm',
          color: 'display.text.secondary.default',
        }}
      >
        Nome da campanha
        <Text
          sx={{
            fontSize: 'xl',
            color: 'display.text.primary.default',
          }}
        >
          {'Campanha XYZ'}
        </Text>
        <Text sx={{ fontSize: 'md' }}>
          {infos.map(([label, value], index) => {
            const isLastItem = index === infos.length - 1;
            return (
              <Text
                key={label}
                sx={{ color: 'display.text.secondary.default' }}
              >
                {label}:{' '}
                <Text
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 'sm',
                    color: 'display.text.secondary.default',
                  }}
                >
                  {value}
                </Text>
                {!isLastItem && (
                  <Text>
                    {'  '}|{'  '}
                  </Text>
                )}
              </Text>
            );
          })}
        </Text>
      </Flex>
    </Flex>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Template: StoryFn<CardProps> = (args: any) => {
  return (
    <Card {...args} sx={{ padding: '0' }}>
      <Flex
        sx={{
          paddingY: '4',
          paddingX: '8',
          width: 'full',
          borderBottom: 'md',
          borderBottomColor: 'display.border.muted.default',
        }}
      >
        <CampaignInfoData />
      </Flex>
      <Flex
        sx={{
          paddingY: '4',
          paddingX: '8',
          width: 'full',
          backgroundColor: 'display.background.muted.default',
        }}
      >
        <Text
          sx={{
            fontSize: 'xl',
            color: 'display.text.primary.default',
          }}
        >
          {'Input Content'}
        </Text>
      </Flex>
    </Card>
  );
};

export const Default = Template.bind({});
Default.args = {
  variant: 'primary',
};
