import { Icon, IconType } from '@ttoss/react-icons';
import { Badge as BadgeUi, type BadgeProps as BadgePropsUi } from 'theme-ui';

import { Text } from '../components/Text';

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
        paddingX: '2',
        borderRadius: 'informative',
        paddingY: '1',
        gap: '2',
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
