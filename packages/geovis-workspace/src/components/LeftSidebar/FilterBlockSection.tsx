import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';
import * as React from 'react';

import { COLOR, FONT_HEAD } from './theme';

/**
 * A block's label: the leading icon and the uppercase title.
 *
 * Exported because the "Variações" body heads itself with the same label. A
 * body and a block are different surfaces, but both sit under the tab bar and
 * both need naming once the header band is gone — and two labels that only
 * looked alike would drift.
 */
export const BlockLabel = ({
  title,
  icon,
}: {
  title: string;
  icon?: string;
}) => {
  return (
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
  );
};

/**
 * One filter block: a header over its control.
 *
 * The header is fixed by default and its body always rendered. Opting into
 * `collapsible` turns the header into a button carrying a chevron, which is
 * what `defaultOpen` then decides the starting state of.
 *
 * @param params.title - Heading shown on the block.
 * @param params.icon - Iconify token rendered before the title.
 * @param params.collapsible - Whether the header toggles the body.
 * @param params.defaultOpen - Starting state, read only while collapsible.
 * @param params.children - The block's control.
 * @returns The block.
 *
 * @example
 * <FilterBlockSection title="Ano" icon="lucide:clock">{control}</FilterBlockSection>
 */
export const FilterBlockSection = ({
  title,
  icon,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  if (!collapsible) {
    return (
      <Box>
        <Box sx={{ marginBottom: '12px' }}>
          <BlockLabel title={title} icon={icon} />
        </Box>

        {children}
      </Box>
    );
  }

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
        <BlockLabel title={title} icon={icon} />

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
