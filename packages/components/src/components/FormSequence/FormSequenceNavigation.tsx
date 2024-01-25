import { Flex, Text } from '@ttoss/ui';
import { Icon } from '@ttoss/react-icons';

type FormSequenceNavigationProps = {
  amountOfSteps: number;
  currentStepNumber: number;
  onBack: () => void;
  stepsLabel: string[];
};

export const FormSequenceNavigation = ({
  amountOfSteps,
  currentStepNumber,
  onBack,
  stepsLabel,
}: FormSequenceNavigationProps) => {
  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        marginX: '2xl',
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
        {currentStepNumber}/{amountOfSteps}
      </Text>
    </Flex>
  );
};
