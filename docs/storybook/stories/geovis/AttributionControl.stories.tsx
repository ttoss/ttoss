import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';

/**
 * **`attributionControlEnabled`** decides whether MapLibre mounts its
 * attribution control — the round button in the map's bottom-right corner that
 * expands into the basemap credits.
 *
 * The field is opt-out, not opt-in: every spec that says nothing keeps the
 * button, so no existing map changes. Only an explicit `false` removes it.
 *
 * ```ts
 * const spec = { ...baseSpec, attributionControlEnabled: false };
 * ```
 *
 * Reach for it when the application already shows the same credits somewhere of
 * its own — a footer, an "about this map" panel — and the floating button would
 * be a second copy. Basemap and source licences (OpenStreetMap's among them)
 * generally require attribution to stay visible, and hiding the control does
 * not lift that obligation; it only moves where you have to satisfy it.
 *
 * ## What to check
 *
 * `SideBySide` is the quickest read: two maps from the same fixture, differing
 * in that one field. The left map carries the round button at the bottom-right;
 * the right map's corner is empty. Click the left one and it expands into the
 * credits.
 *
 * `Default` and `Disabled` are the same two maps on their own, full width.
 */
const meta = {
  title: 'GeoVis/AttributionControl',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

const baseSpec = singleMapSpec as VisualizationSpec;

/** The fixture untouched: no `attributionControlEnabled`, so the button stays. */
const defaultSpec: VisualizationSpec = {
  ...baseSpec,
  title: 'Attribution control — default',
  description:
    'The spec says nothing about the attribution control, so MapLibre mounts it: the round button sits in the bottom-right corner and expands into the basemap credits.',
};

/** The same fixture with the control explicitly switched off. */
const disabledSpec: VisualizationSpec = {
  ...baseSpec,
  title: 'Attribution control — disabled',
  description:
    'attributionControlEnabled: false — the bottom-right corner is empty. The credits now have to appear somewhere the application owns.',
  attributionControlEnabled: false,
};

const MapFrame = ({
  spec,
  height = 480,
}: {
  spec: VisualizationSpec;
  height?: number;
}) => {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div>
        <strong>{spec.title}</strong>
        {spec.description ? (
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>{spec.description}</p>
        ) : null}
      </div>
      <div style={{ width: '100%', height, border: '1px solid #d4d4d8' }}>
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas viewId="primary" />
        </GeoVisProvider>
      </div>
    </div>
  );
};

/**
 * Both maps at once, from one fixture and one differing field — the left keeps
 * the round button in its bottom-right corner, the right does not.
 */
export const SideBySide: StoryFn = () => {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      }}
    >
      <MapFrame spec={defaultSpec} height={420} />
      <MapFrame spec={disabledSpec} height={420} />
    </div>
  );
};

/** The button as it ships: present because the spec never mentions the field. */
export const Default: StoryFn = () => {
  return <MapFrame spec={defaultSpec} />;
};

/** The same map with `attributionControlEnabled: false`; the corner is bare. */
export const Disabled: StoryFn = () => {
  return <MapFrame spec={disabledSpec} />;
};
