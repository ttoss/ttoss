import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';
import * as React from 'react';

import { COLOR, FONT_HEAD } from './theme';

/** A collapsible filter block: an uppercase header toggling its body. */
export const CollapsibleSection = ({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Box>
      <Box
        as="button"
        {...({ type: 'button' } as object)}
        onClick={() => {
          setOpen((current) => {
            return !current;
          });
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '12px',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
            fontFamily: FONT_HEAD,
            fontWeight: 600,
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLOR.textFaint,
          }}
        >
          {icon ? (
            <Icon
              icon={icon}
              style={{ fontSize: '12px', color: COLOR.textGhost }}
            />
          ) : null}
          {title}
        </Flex>

        <Icon
          icon="lucide:chevron-down"
          style={{
            fontSize: '12px',
            color: COLOR.textGhost,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
          }}
        />
      </Box>

      {open ? children : null}
    </Box>
  );
};
