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
    <Flex
      sx={{
        justifyContent: 'space-between',
        marginX: '2xl',
        marginY: 'xl',
      }}
    >
      <Flex onClick={onBack} sx={{ alignItems: 'center', cursor: 'pointer' }}>
        <Text sx={{ color: '#ACADB7', display: 'flex' }}>
          <Icon icon="nav-left" />
        </Text>
        <Text sx={{ color: '#ACADB7' }}>Propriedade</Text>
      </Flex>

      <Text sx={{ alignItems: 'center', color: '#ACADB7' }}>
        {currentStepNumber}/{amountOfSteps}
      </Text>
    </Flex>
  );
};
