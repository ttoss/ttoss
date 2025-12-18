import { Icon, type IconType } from '@ttoss/react-icons';
import { Flex, Stack, Text } from '@ttoss/ui';
import type * as React from 'react';

import type { PlanCardVariantType } from './PlanCardVariants';
import { getPlanCardVariantStyles } from './PlanCardVariants';

export type PlanCardMetadataSlotParameter = {
  name: string;
  value: React.ReactNode;
};

export type PlanCardMetadataSlotService = {
  label: string;
  icon?: IconType;
  parameters: PlanCardMetadataSlotParameter[];
  id?: string;
  key?: string;
};

export type PlanCardMetadataSlotVariant = PlanCardVariantType;

export interface PlanCardMetadataSlotProps {
  metadata: PlanCardMetadataSlotService[];
  variant?: PlanCardMetadataSlotVariant;
}

export const PlanCardMetadataSlot = ({
  metadata,
  variant = 'primary',
}: PlanCardMetadataSlotProps) => {
  const variantStyles = getPlanCardVariantStyles(variant);

  return (
    <Stack sx={{ width: 'full', gap: '6' }}>
      {metadata.map((service) => {
        const serviceKey = service.id ?? service.key ?? service.label;

        return (
          <Flex
            key={serviceKey}
            sx={{
              gap: '3',
              flexDirection: 'column',
              width: 'full',
            }}
          >
            <Flex
              sx={{
                gap: '4',
                alignItems: 'center',
                color: variantStyles.secondaryColor,
                width: 'full',
              }}
            >
              {service.icon && <Icon icon={service.icon} />}
              <Text
                sx={{
                  color: variantStyles.secondaryColor,
                }}
              >
                {service.label + String.fromCharCode(58)}
              </Text>
            </Flex>

            {service.parameters.map((parameter) => {
              return (
                <Flex
                  key={parameter.name}
                  sx={{
                    paddingX: '6',
                    paddingY: '4',
                    backgroundColor: 'display.background.muted.default',
                    borderRadius: 'lg',
                    width: 'full',
                  }}
                >
                  <Flex
                    sx={{
                      width: 'full',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '2',
                    }}
                  >
                    <Text sx={{ fontSize: 'sm', textAlign: 'center' }}>
                      {parameter.name}
                    </Text>
                    <Text sx={{ fontWeight: 'semibold', fontSize: 'lg' }}>
                      {parameter.value}
                    </Text>
                  </Flex>
                </Flex>
              );
            })}
          </Flex>
        );
      })}
    </Stack>
  );
};
