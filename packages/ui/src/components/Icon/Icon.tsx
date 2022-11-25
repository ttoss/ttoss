import { IconProps as IconPropsUI, Icon as IconUI } from '@iconify/react';
import { Text, TextProps } from '../Text/Text';

export type IconProps = TextProps & {
  icon: IconPropsUI['icon'];
  iconProps?: Omit<IconPropsUI, 'icon'>;
};

export const Icon = ({ icon, sx, iconProps, ...props }: IconProps) => {
  return (
    <Text sx={sx} {...props}>
      <IconUI {...iconProps} icon={icon} />
    </Text>
  );
};
