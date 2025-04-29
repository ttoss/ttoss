import { Icon } from '@ttoss/react-icons';
import {
  IconButton as IconButtonUi,
  type IconButtonProps as ThemeUIIconButtonProps,
} from 'theme-ui';

export type IconButtonProps = ThemeUIIconButtonProps & {
  icon?: string;
};

export const IconButton = (props: IconButtonProps) => {
  const { icon, children, ...restProps } = props;

  return (
    <IconButtonUi
      type="button"
      {...restProps}
      sx={{
        borderRadius: 'sm',
        ...restProps.sx,
      }}
    >
      {icon ? <Icon inline icon={icon} /> : children}
    </IconButtonUi>
  );
};
