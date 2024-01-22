import { CloseButton, Flex, Image, Text } from '@ttoss/ui';

import { Icon, type IconType } from '@ttoss/react-icons';

type FormSequenceHeaderVariant = 'logo' | 'titled';

type BaseFormSequenceHeaderProps = {
  variant: FormSequenceHeaderVariant;
};

export type FormSequenceHeaderLogoProps = BaseFormSequenceHeaderProps & {
  variant: 'logo';
  src: string;
  onClose: () => void;
};

const FormSequenceHeaderLogo = ({
  onClose,
  src,
}: FormSequenceHeaderLogoProps) => {
  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingX: 'xl',
        paddingY: 'lg',
      }}
    >
      <Image
        width={115}
        height={32}
        sx={{ objectFit: 'cover', width: 115, height: 32 }}
        src={src}
      />

      <CloseButton onClick={onClose} />
    </Flex>
  );
};

type FormSequenceHeaderTitledProps = BaseFormSequenceHeaderProps & {
  variant: 'titled';
  title: string;
  leftIcon: IconType;
  rightIcon: IconType;
  leftIconClick: () => void;
  rightIconClick: () => void;
};

const FormSequenceHeaderTitled = ({
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

export type FormSequenceHeaderProps =
  | FormSequenceHeaderLogoProps
  | FormSequenceHeaderTitledProps;

export const FormSequenceHeader = (props: FormSequenceHeaderProps) => {
  if (props.variant === 'logo') {
    return <FormSequenceHeaderLogo {...props} />;
  }
  if (props.variant === 'titled') {
    return <FormSequenceHeaderTitled {...props} />;
  }

  return null;
};
