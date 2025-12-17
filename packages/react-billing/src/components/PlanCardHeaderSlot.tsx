import { Box, Flex, Heading, Text } from '@ttoss/ui';

import type { PlanCardVariant } from './PlanCardVariant';

export interface PlanCardHeaderSlotProps {
  title: string;
  subtitle?: string;
  hasTopTag?: boolean;
  variant?: PlanCardVariant;
}

export const PlanCardHeaderSlot = ({
  title,
  subtitle,
  hasTopTag,
  variant = 'default',
}: PlanCardHeaderSlotProps) => {
  const isEnterprise = variant === 'enterprise';

  return (
    <Box
      sx={{
        paddingY: hasTopTag ? '4' : '8',
        paddingX: '8',
        width: 'full',
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '2',
          width: 'full',
          alignItems: 'center',
        }}
      >
        <Heading
          sx={{ fontSize: '3xl', color: isEnterprise ? 'white' : 'text' }}
        >
          {title}
        </Heading>
        {subtitle && (
          <Text
            sx={{
              fontSize: 'sm',
              color: isEnterprise ? 'white' : 'display.text.secondary.default',
            }}
          >
            {subtitle}
          </Text>
        )}
      </Flex>
    </Box>
  );
};
