import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Flex, Text } from '@ttoss/ui';

export type MultistepNavigationProps = {
  amountOfSteps: number;
  currentStepNumber: number;
  onBack: () => void;
  stepsLabel: string[];
};

const messages = defineMessages({
  stepCounter: {
    defaultMessage: '{current}/{total}',
    description:
      'Multistep form: position in the flow. Only the separator is translatable; both values are numbers.',
  },
});

export const MultistepNavigation = ({
  amountOfSteps,
  currentStepNumber,
  onBack,
  stepsLabel,
}: MultistepNavigationProps) => {
  const { intl } = useI18n();

  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        marginX: '5',
      }}
    >
      <Flex onClick={onBack} sx={{ alignItems: 'center', cursor: 'pointer' }}>
        <Text sx={{ color: '#ACADB7', display: 'flex' }}>
          <Icon icon="nav-left" />
        </Text>
        <Text sx={{ color: '#ACADB7' }}>
          {stepsLabel[currentStepNumber - 2]}
        </Text>
      </Flex>

      <Text sx={{ alignItems: 'center', color: '#ACADB7' }}>
        {intl.formatMessage(messages.stepCounter, {
          current: currentStepNumber,
          total: amountOfSteps,
        })}
      </Text>
    </Flex>
  );
};
