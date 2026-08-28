import { Icon } from '@ttoss/react-icons';
import { Flex } from '@ttoss/ui';

/** A small square icon chip, sized in pixels. */
export const IconChip = ({
  icon,
  color,
  background,
  size,
  iconSize,
}: {
  icon: string;
  color: string;
  background: string;
  size: number;
  iconSize: number;
}) => {
  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        backgroundColor: background,
      }}
    >
      <Icon icon={icon} style={{ fontSize: `${iconSize}px`, color }} />
    </Flex>
  );
};
