import { Steps } from '@chakra-ui/react';
import { Box, Flex } from '@ttoss/ui';
import type * as React from 'react';

import type { WizardLayout, WizardStep, WizardStepStatus } from './types';

interface WizardStepListProps {
  steps: WizardStep[];
  currentStep: number;
  layout: WizardLayout;
  allowStepClick: boolean;
  getStepStatus: (params: { stepIndex: number }) => WizardStepStatus;
  onStepClick: (params: { stepIndex: number }) => void;
}

export const WizardStepList = ({
  steps,
  currentStep,
  layout,
  allowStepClick,
  getStepStatus,
  onStepClick,
}: WizardStepListProps) => {
  const isHorizontal = layout === 'top' || layout === 'bottom';
  const orientation = isHorizontal ? 'horizontal' : 'vertical';

  return (
    <Flex
      role="navigation"
      aria-label="Wizard steps"
      sx={{
        padding: '6',
        backgroundColor: 'navigation.background.muted.default',
        ...(isHorizontal
          ? {
              width: '100%',
              borderBottom: layout === 'top' ? '1px solid' : undefined,
              borderTop: layout === 'bottom' ? '1px solid' : undefined,
              borderColor: 'display.border.muted.default',
            }
          : {
              minWidth: '200px',
              borderRight: layout === 'left' ? '1px solid' : undefined,
              borderLeft: layout === 'right' ? '1px solid' : undefined,
              borderColor: 'display.border.muted.default',
            }),
      }}
    >
      <Steps.Root
        step={currentStep}
        count={steps.length}
        orientation={orientation}
      >
        <Steps.List>
          {steps.map((step, index) => {
            const status = getStepStatus({ stepIndex: index });
            const isClickable =
              allowStepClick && status === 'completed' && index !== currentStep;

            return (
              <Steps.Item key={index} index={index}>
                <Flex
                  sx={{
                    flexDirection: isHorizontal ? 'column' : 'row',
                    alignItems: 'center',
                    gap: '2',
                  }}
                >
                  <Box
                    role="button"
                    tabIndex={isClickable ? 0 : -1}
                    onClick={() => {
                      if (isClickable) {
                        onStepClick({ stepIndex: index });
                      }
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onStepClick({ stepIndex: index });
                      }
                    }}
                    aria-current={status === 'active' ? 'step' : undefined}
                    sx={{
                      cursor: isClickable ? 'pointer' : 'default',
                    }}
                  >
                    <Steps.Indicator>
                      <Steps.Status
                        complete="✓"
                        incomplete={<Steps.Number />}
                      />
                    </Steps.Indicator>
                  </Box>
                  {(step.title || step.description) && (
                    <Box>
                      {step.title && <Steps.Title>{step.title}</Steps.Title>}
                      {step.description && (
                        <Steps.Description>
                          {step.description}
                        </Steps.Description>
                      )}
                    </Box>
                  )}
                </Flex>
                {index < steps.length - 1 && <Steps.Separator />}
              </Steps.Item>
            );
          })}
        </Steps.List>
      </Steps.Root>
    </Flex>
  );
};
