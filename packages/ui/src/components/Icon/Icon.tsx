import { IconProps as IconPropsUI, Icon as IconUI } from '@iconify/react';
import { Text, TextProps } from '../Text/Text';

export type IconProps = {
  icon: IconPropsUI['icon'];
  sx?: TextProps['sx'];
};

export const Icon = ({ icon, sx }: IconProps) => {
  return (
    <Text sx={sx}>
      <IconUI icon={icon} />
    </Text>
  );
};
