import { GeoVisLegend, useGeoVis } from '@ttoss/geovis';
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

/** Renders every top-level legend the committed spec resolves, in declaration order. */
const RuntimeLegends = () => {
  const { spec } = useGeoVis();

  const legends = spec.legends ?? [];
  if (legends.length === 0) return null;

  return (
    <Flex sx={{ flexDirection: 'column', gap: '2' }}>
      {legends.map((legend) => {
        return (
          <GeoVisLegend key={legend.id} legendId={legend.id} noPositionWrap />
        );
      })}
    </Flex>
  );
};

/** Empty default for right-sidebar slots without a default panel yet. */
const EmptyPanel = () => {
  return null;
};

/**
 * Default content of the `legend` slot: an optional description, the spec's
 * runtime-resolved legends and a list of data sources. Each block renders
 * only when present.
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

      <RuntimeLegends />

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
        position: 'relative',
        flexDirection: 'column',
        gap: '4',
        // Fills the full-width overlay on mobile; fixed panel on larger screens.
        // Matches the left sidebar width so both panels read as the same size.
        width: ['100%', '300px'],
        height: '100%',
        flexShrink: 0,
        paddingX: '4',
        paddingTop: '5',
        paddingBottom: '4',
        // Warm ivory surface (cozsolidarias brand) — never cold white.
        backgroundColor: '#FAF9F7',
        // Floating card on larger screens; flush full-screen panel on mobile.
        border: '1px solid #E4DED3',
        borderRadius: [0, '16px'],
        boxShadow: ['none', '0 8px 24px rgba(36, 31, 33, 0.12)'],
        overflowY: 'auto',
      }}
    >
      <IconButton
        icon="lucide:chevron-right"
        aria-label={formatMessage(messages.closeDetails)}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          // Release focus before the sidebar hides itself (aria-hidden), so a
          // focused element is never hidden from assistive technology.
          event.currentTarget.blur();
          setRightSidebarOpen({ open: false });
        }}
        sx={{
          position: 'absolute',
          top: '3',
          right: '3',
          color: '#7A716D',
          backgroundColor: 'transparent',
          borderRadius: 'md',
          '&:hover': {
            color: '#A23228',
          },
        }}
      />

      <Heading
        as="h3"
        sx={{
          margin: 0,
          fontSize: 'xs',
          fontWeight: 'semibold',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#7A716D',
        }}
      >
        {config.rightSidebar?.title ?? formatMessage(messages.detailsTitle)}
      </Heading>

      {RIGHT_SIDEBAR_SLOTS.map((slot) => {
        if (config.slots?.[slot]?.hidden === true) return null;
        const Override = config.slots?.[slot]?.component;
        const DefaultPanel = DEFAULT_PANELS[slot];
        return Override ? <Override key={slot} /> : <DefaultPanel key={slot} />;
      })}
    </Flex>
  );
};
