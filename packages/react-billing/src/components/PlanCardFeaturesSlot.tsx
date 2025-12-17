import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

import type { PlanCardVariant } from './PlanCardVariant';

export interface PlanCardFeaturesSlotProps {
  features: unknown[];
  variant?: PlanCardVariant;
}

const featuresTitle = 'RECURSOS';

export const PlanCardFeaturesSlot = ({
  features,
  variant = 'default',
}: PlanCardFeaturesSlotProps) => {
  const isEnterprise = variant === 'enterprise';
  const featureColor = isEnterprise
    ? 'white'
    : 'feedback.text.positive.default';

  return (
    <Box
      sx={{
        paddingY: '4',
        paddingX: '6',
        width: 'full',
        borderTop: 'md',
        borderBottom: 'md',
        borderColor: 'display.border.muted.default',
      }}
    >
      <Stack sx={{ gap: '5', paddingY: '3' }}>
        <Flex
          sx={{
            letterSpacing: 'widest',
            color: isEnterprise ? 'white' : 'text',
          }}
        >
          {featuresTitle}
        </Flex>
        <Flex sx={{ flexDirection: 'column', gap: '3' }}>
          {features.map((feature, index) => {
            if (React.isValidElement(feature)) {
              return <React.Fragment key={index}>{feature}</React.Fragment>;
            }

            return (
              <Flex
                key={index}
                sx={{
                  fontSize: 'sm',
                  color: featureColor,
                  alignItems: 'center',
                  gap: '3',
                }}
              >
                <Icon icon="fluent:checkmark-24-filled" />
                <Text
                  sx={{
                    fontSize: 'sm',
                    color: featureColor,
                    alignItems: 'center',
                  }}
                >
                  {String(feature)}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Stack>
    </Box>
  );
};
