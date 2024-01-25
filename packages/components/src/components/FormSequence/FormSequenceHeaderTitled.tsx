import { Flex, Text } from '@ttoss/ui';

import { BaseFormSequenceHeaderProps } from './types';

import { Icon, type IconType } from '@ttoss/react-icons';

export type FormSequenceHeaderTitledProps = BaseFormSequenceHeaderProps & {
  variant: 'titled';
  title: string;
  leftIcon: IconType;
  rightIcon: IconType;
  leftIconClick: () => void;
  rightIconClick: () => void;
};

export const FormSequenceHeaderTitled = ({
  title,
  leftIcon,
  leftIconClick,
  rightIcon,
  rightIconClick,
}: FormSequenceHeaderTitledProps) => {
  return (
    <Flex
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingX: 'xl',
        paddingY: 'lg',
        alignItems: 'center',
      }}
    >
      <Icon icon={leftIcon} onClick={leftIconClick} />

      <Text sx={{ fontWeight: 'bold', fontSize: 'lg' }}>{title}</Text>

      <Icon icon={rightIcon} onClick={rightIconClick} />
    </Flex>
  );
};
