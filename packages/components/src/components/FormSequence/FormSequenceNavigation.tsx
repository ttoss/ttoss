import { Flex, Text } from '@ttoss/ui';
import { Icon } from '@ttoss/react-icons';

type FormSequenceNavigationProps = {
  amountOfSteps: number;
  currentStepNumber: number;
  onBack: () => void;
};

export const FormSequenceNavigation = ({
  amountOfSteps,
  currentStepNumber,
  onBack,
}: FormSequenceNavigationProps) => {
  return (
    <Flex sx={{ justifyContent: 'space-between' }}>
      <Flex onClick={onBack} sx={{ alignItems: 'center' }}>
        <Icon icon="arrow-left" />

        <Text>Item Anterior</Text>
      </Flex>

      <Text sx={{ alignItems: 'center' }}>
        {currentStepNumber}/{amountOfSteps}
      </Text>
    </Flex>
  );
};
