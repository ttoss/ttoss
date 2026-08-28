import { Text } from '@ttoss/ui';

import type {
  GeovisWorkspaceConfig,
  GeovisWorkspaceFooterPosition,
} from '../context/GeovisWorkspaceContext';
import { TIMELINE_HUD_CONTROL_CLEARANCE } from '../controlOffset';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { COLOR, FONT_MONO } from './LeftSidebar/theme';
import { findActiveVariation, useSections } from './LeftSidebar/useSections';

/**
 * Widest the bar may grow. Past this the label truncates: the bar names what is
 * on screen, and is never worth covering the map to finish a sentence.
 */
const MAX_WIDTH = '260px';

const BORDER = `1px solid ${COLOR.border}`;

/**
 * Horizontal anchoring per position. Each variant borders only the edges that
 * face the map — the ones lying on its boundary would draw a line along the
 * container's own edge.
 */
const ANCHOR: Record<GeovisWorkspaceFooterPosition, Record<string, unknown>> = {
  left: { left: 0, borderRight: BORDER },
  center: {
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: BORDER,
    borderRight: BORDER,
  },
  right: { right: 0, borderLeft: BORDER },
};

/** Reads the position out of the `footer` config; `true` means the default. */
const resolvePosition = (
  footer: GeovisWorkspaceConfig['footer']
): GeovisWorkspaceFooterPosition => {
  return typeof footer === 'object' ? (footer.position ?? 'center') : 'center';
};

/**
 * The slim bar flush against the map's bottom edge naming the selected
 * variation, mounted when `config.footer` is set.
 *
 * Square and flush, with no inset. `position: 'right'` puts it where MapLibre
 * keeps its attribution control, so the two overlap there unless the spec turns
 * the control off (`attributionControlEnabled: false`) or the basemap carries
 * no attribution — which is why the default is `'center'`.
 *
 * Read-only and inert (`pointerEvents: 'none'`) so it never intercepts a click
 * meant for the map beneath it. It renders nothing when the sidebar declares no
 * variations section, or when the selection matches no variation — an empty bar
 * would be worse than no bar.
 *
 * @example
 * <GeovisWorkspace config={{ footer: { position: 'right' }, leftSidebar }} ... />
 */
export const MapFooter = ({ hudVisible }: { hudVisible: boolean }) => {
  const { config, selection } = useGeovisWorkspace();
  const { variationsBody } = useSections(config.leftSidebar?.sections ?? []);

  const activeVariation = findActiveVariation({ variationsBody, selection });

  if (!activeVariation) {
    return null;
  }

  const anchor = ANCHOR[resolvePosition(config.footer)];

  return (
    <Text
      // The compact timeline bar spans the same edge, so the footer steps above
      // it rather than sitting underneath — the same clearance the map's layer
      // control uses.
      sx={{
        position: 'absolute',
        zIndex: 2,
        // Flush against the bottom edge: no inset, and square.
        bottom: hudVisible ? `${TIMELINE_HUD_CONTROL_CLEARANCE}px` : 0,
        maxWidth: MAX_WIDTH,
        paddingX: '6px',
        paddingY: '2px',
        borderRadius: 0,
        borderTop: BORDER,
        ...anchor,
        backgroundColor: COLOR.surface,
        color: COLOR.textMuted,
        fontFamily: FONT_MONO,
        fontSize: '10px',
        lineHeight: 1.4,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        pointerEvents: 'none',
        transition: 'bottom 0.2s ease-in-out',
      }}
      title={activeVariation.label}
    >
      {activeVariation.label}
    </Text>
  );
};
