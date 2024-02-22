import {
  type BadgeProps as BadgePropsUi,
  Badge as BadgeUi,
  Text,
} from 'theme-ui';
import { Icon, IconType } from '@ttoss/react-icons';

export type BadgeProps = BadgePropsUi & {
  icon?: IconType;
  chip?: boolean;
  onDelete?: () => void;
};

export const Badge = ({
  icon,
  children,
  sx,
  chip,
  onDelete,
  ...props
}: BadgeProps) => {
  return (
    <BadgeUi
      sx={{
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'caption',
        fontWeight: 'normal',
        lineHeight: 'base',
        fontSize: 'sm',
        paddingX: 'xs',
        borderRadius: 'informative',
        paddingY: '2xs',
        gap: 'xs',
        ...sx,
      }}
      {...props}
    >
      {icon && <Icon inline icon={icon} />}

      {children}

      {chip && (
        <Text
          sx={{
            cursor: 'pointer',
            lineHeight: 0,
            color: 'currentcolor',
            alignSelf: 'center',
          }}
        >
          <Icon onClick={onDelete} inline icon="close" />
        </Text>
      )}
    </BadgeUi>
  );
};
