import { CloseButton, Flex, Image, Text } from '@ttoss/ui';
import { Icon, type IconType } from '@ttoss/react-icons';

type HeaderTitledProps = {
  variant: 'titled';
  title: string;
  leftIcon: IconType;
  rightIcon: IconType;
  leftIconClick: () => void;
  rightIconClick: () => void;
};

const HeaderTitled = ({
  title,
  leftIcon,
  leftIconClick,
  rightIcon,
  rightIconClick,
}: HeaderTitledProps) => {
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

type HeaderLogoProps = {
  variant: 'logo';
  src: string;
  onClose?: () => void;
};

const HeaderLogo = ({ onClose, src }: HeaderLogoProps) => {
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
      {onClose && <CloseButton onClick={onClose} />}
    </Flex>
  );
};

export type HeaderProps = HeaderLogoProps | HeaderTitledProps;

export const Header = (props: HeaderProps) => {
  if (props.variant === 'logo') {
    return <HeaderLogo {...props} />;
  }

  if (props.variant === 'titled') {
    return <HeaderTitled {...props} />;
  }

  return null;
};
