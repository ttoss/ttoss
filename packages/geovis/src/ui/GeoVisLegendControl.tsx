import type { LegendPosition } from '../spec/types';
import {
  buildLegendPanelStyle,
  buildLegendTriggerStyle,
} from './GeoVisLayerControl.styles';
import { GeoVisLegend } from './GeoVisLegend';

/** Default accessible name for the trigger when no label is supplied. */
export const DEFAULT_LEGEND_LABEL = 'Legend';

/**
 * Stacked-swatches glyph for the legend trigger — a colour scale in miniature,
 * echoing what the panel reveals. Inherits its colour from the button.
 */
const LegendGlyph = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect x="3" y="5" width="6" height="4" rx="1" />
      <rect x="11" y="6" width="10" height="2" rx="1" opacity="0.75" />
      <rect x="3" y="12" width="6" height="4" rx="1" opacity="0.75" />
      <rect x="11" y="13" width="10" height="2" rx="1" opacity="0.55" />
      <rect x="3" y="19" width="6" height="3" rx="1" opacity="0.5" />
      <rect x="11" y="19" width="7" height="2" rx="1" opacity="0.4" />
    </svg>
  );
};

/**
 * Compact stand-in for the map's floating legend cards, shown below the compact
 * breakpoint. Sits in the control bar beside the layer-control trigger and
 * takes the control's accent while its panel is open, so the pressed state is
 * unmistakable.
 *
 * The panel it opens is {@link GeoVisLegendPanel}, rendered as a sibling
 * anchored to the map rather than a child of this button — that is what lets it
 * span the map from side to side.
 */
export const GeoVisLegendTrigger = ({
  open,
  onToggle,
  label = DEFAULT_LEGEND_LABEL,
}: {
  /** Whether the legend panel is currently showing. */
  open: boolean;
  /** Toggles the panel. */
  onToggle: () => void;
  /** Accessible name for the button. Defaults to `'Legend'`. */
  label?: string;
}) => {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={label}
      title={label}
      style={buildLegendTriggerStyle(open)}
      onClick={onToggle}
    >
      <LegendGlyph />
    </button>
  );
};

/**
 * Every positioned legend, stacked in one panel that spans the map's full
 * width. Anchored to the map (not to the trigger) so it can pin both
 * horizontal edges; each card is rendered with `stretch` so it fills that width
 * instead of keeping its own.
 */
export const GeoVisLegendPanel = ({
  legendIds,
  position,
  offset,
  label = DEFAULT_LEGEND_LABEL,
}: {
  /** Ids of every positioned legend, stacked in spec order. */
  legendIds: string[];
  /** Corner the control bar is anchored to; decides which way the panel opens. */
  position: LegendPosition;
  /** The control's edge gap, so the panel lines up with the bar. */
  offset?: number | { x?: number; y?: number };
  /** Accessible name for the group. Defaults to `'Legend'`. */
  label?: string;
}) => {
  return (
    <div
      role="group"
      aria-label={label}
      style={buildLegendPanelStyle({ position, offset })}
    >
      {legendIds.map((id) => {
        return <GeoVisLegend key={id} legendId={id} noPositionWrap stretch />;
      })}
    </div>
  );
};
