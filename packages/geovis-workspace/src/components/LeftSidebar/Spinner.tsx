import { Icon } from '@ttoss/react-icons';
import { Box } from '@ttoss/ui';

import { COLOR } from './theme';

/**
 * A spinning loader in the workspace accent. The rotation is a CSS `transform`,
 * so it keeps turning on the compositor while the main thread is busy — during
 * a map capture, say.
 */
export const Spinner = ({ size, label }: { size: string; label?: string }) => {
  return (
    <Box
      {...(label ? ({ role: 'status', 'aria-label': label } as object) : {})}
      sx={{
        flexShrink: 0,
        display: 'flex',
        color: COLOR.primary,
        '@keyframes geovisWorkspaceSpin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        animation: 'geovisWorkspaceSpin 0.7s linear infinite',
      }}
    >
      <Icon icon="lucide:loader-circle" style={{ fontSize: size }} />
    </Box>
  );
};
