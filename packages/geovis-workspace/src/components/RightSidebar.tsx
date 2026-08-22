import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, Heading, IconButton, Link, Text } from '@ttoss/ui';
import type * as React from 'react';

import {
  type GeovisWorkspaceSlotName,
  type GeovisWorkspaceSource,
} from '../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';
import { RIGHT_SIDEBAR_SLOTS } from '../slots';
import { InspectorSlot } from './InspectorPanel';
import { COLOR, FONT_HEAD } from './LeftSidebar/theme';
import { MetadataPanel } from './MetadataPanel';
import { WarningsPanel } from './WarningsPanel';

/** Renders one data-source entry, as an external link when `href` is set. */
const SourceItem = ({ label, href }: GeovisWorkspaceSource) => {
  return (
    <Box as="li" sx={{ fontSize: 'xs', color: '#7A716D', lineHeight: 'base' }}>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: '#A23228', textDecoration: 'underline' }}
        >
          {label}
        </Link>
      ) : (
        label
      )}
    </Box>
  );
};

/** Empty default for right-sidebar slots without a default panel yet. */
const EmptyPanel = () => {
  return null;
};

/**
 * Default content of the `legend` slot: an optional description and a list of
 * data sources, both taken from `config.legend`. Each block renders only when
 * the consumer provides it. Spec legends are NOT auto-rendered here — they are
 * map overlays; the right sidebar shows only consumer-configured content.
 */
const LegendPanel = () => {
  const { config } = useGeovisWorkspace();
  const { description, sources } = config.legend ?? {};

  return (
    <Flex sx={{ flexDirection: 'column', gap: '4' }}>
      {description && (
        <Text sx={{ fontSize: 'sm', color: '#524945', lineHeight: 'base' }}>
          {description}
        </Text>
      )}

      {sources && (
        <Box>
          {sources.title && (
            <Text
              sx={{ fontSize: 'sm', fontWeight: 'semibold', color: '#7A716D' }}
            >
              {sources.title}
            </Text>
          )}

          <Box
            as="ul"
            sx={{
              paddingLeft: '4',
              marginTop: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '1',
            }}
          >
            {sources.items.map((source) => {
              return <SourceItem key={source.label} {...source} />;
            })}
          </Box>
        </Box>
      )}
    </Flex>
  );
};

/** Default panel per right-sidebar slot; `map`/`controls` have no right-sidebar panel. */
const DEFAULT_PANELS: Record<GeovisWorkspaceSlotName, React.ComponentType> = {
  map: EmptyPanel,
  controls: EmptyPanel,
  legend: LegendPanel,
  warnings: WarningsPanel,
  inspector: InspectorSlot,
  metadata: MetadataPanel,
};

/**
 * Internal right sidebar: the chrome hosting the legend/warnings/inspector/
 * metadata slots, stacked in that order. Rendered only when `Layout`
 * determines at least one of them has content.
 */
export const RightSidebar = () => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const { config, setRightSidebarOpen } = useGeovisWorkspace();

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        // Fills the full-width overlay on mobile; fixed panel on larger screens.
        // Matches the left sidebar preview width so both panels read alike.
        width: ['100%', '308px'],
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        // Prototype card: warm ivory surface, hairline border, soft shadow,
        // rounded on larger screens; flush full-screen panel on mobile.
        backgroundColor: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        borderRadius: [0, '16px'],
        boxShadow: ['none', '0 8px 40px rgba(0,0,0,0.14)'],
      }}
    >
      {/* Fixed header: display title + close, divided from the scrolling body. */}
      <Flex
        sx={{
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          paddingX: '20px',
          paddingY: '16px',
          borderBottom: `1px solid ${COLOR.border}`,
        }}
      >
        <Heading
          as="h3"
          sx={{
            margin: 0,
            fontFamily: FONT_HEAD,
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: COLOR.textStrong,
          }}
        >
          {config.rightSidebar?.title ?? formatMessage(messages.detailsTitle)}
        </Heading>

        <IconButton
          icon="lucide:x"
          aria-label={formatMessage(messages.closeDetails)}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            // Release focus before the sidebar hides itself (aria-hidden), so a
            // focused element is never hidden from assistive technology.
            event.currentTarget.blur();
            setRightSidebarOpen({ open: false });
          }}
          sx={{
            width: '28px',
            height: '28px',
            minWidth: 'auto',
            flexShrink: 0,
            color: COLOR.textGhost,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderRadius: 'md',
            '&:hover': { color: COLOR.textMuted, backgroundColor: COLOR.fill },
          }}
        />
      </Flex>

      {/* Scrolling body: the stacked slots. */}
      <Flex
        sx={{
          flex: 1,
          minHeight: 0,
          flexDirection: 'column',
          gap: '4',
          paddingX: '4',
          paddingY: '4',
          overflowY: 'auto',
        }}
      >
        {RIGHT_SIDEBAR_SLOTS.map((slot) => {
          if (config.slots?.[slot]?.hidden === true) return null;
          const Override = config.slots?.[slot]?.component;
          const DefaultPanel = DEFAULT_PANELS[slot];
          return Override ? (
            <Override key={slot} />
          ) : (
            <DefaultPanel key={slot} />
          );
        })}
      </Flex>
    </Flex>
  );
};
