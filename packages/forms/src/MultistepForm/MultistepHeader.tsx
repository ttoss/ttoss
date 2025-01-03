import { Icon, type IconType } from '@ttoss/react-icons';
import { CloseButton, Flex, Image, Text } from '@ttoss/ui';

type MultistepHeaderTitledProps = {
  variant: 'titled';
  title: string;
  leftIcon: IconType;
  rightIcon: IconType;
  onLeftIconClick: () => void;
  onRightIconClick: () => void;
};

const MultistepHeaderTitled = ({
  title,
  leftIcon,
  onLeftIconClick,
  rightIcon,
  onRightIconClick,
}: MultistepHeaderTitledProps) => {
  return (
    <Flex
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingX: '5',
        paddingY: '4',
        alignItems: 'center',
      }}
    >
      <Icon icon={leftIcon} onClick={onLeftIconClick} />
      <Text sx={{ fontWeight: 'bold', fontSize: 'lg' }}>{title}</Text>
      <Icon icon={rightIcon} onClick={onRightIconClick} />
    </Flex>
  );
};

type MultistepHeaderLogoProps = {
  variant: 'logo';
  src: string;
  onClose?: () => void;
};

const MultistepHeaderLogo = ({ onClose, src }: MultistepHeaderLogoProps) => {
  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingX: '5',
        paddingY: '4',
      }}
    >
      <Image
        width={115}
        height={32}
        sx={{ objectFit: 'cover', width: 115, height: 32 }}
        src={src}
      />
      {onClose && <CloseButton onClick={onClose} />}
    </Flex>
  );
};

export type MultistepHeaderProps =
  | MultistepHeaderLogoProps
  | MultistepHeaderTitledProps;

export const MultistepHeader = (props: MultistepHeaderProps) => {
  if (props.variant === 'logo') {
    return <MultistepHeaderLogo {...props} />;
  }

  if (props.variant === 'titled') {
    return <MultistepHeaderTitled {...props} />;
  }

  return null;
};
