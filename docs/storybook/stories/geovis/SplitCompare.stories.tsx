import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';
import * as React from 'react';

import fixture from '../../../../packages/geovis/src/fixtures/split-compare.json';
import type { LockRef, MapRef } from './_map-story-helpers';
import {
  computeBbox,
  FitBoundsToBbox,
  MapLabel,
  MapSync,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/SplitCompare',
  tags: ['autodocs'],
} as Meta;

const splitCompareBbox = computeBbox(
  fixture.sources[0].data as GeoJSON.FeatureCollection
);

// Specs derived from the same fixture.
// Both share source, view and basemap. Only the layers differ.

const leftSpec: VisualizationSpec = {
  ...(fixture as unknown as VisualizationSpec),
  layers: (fixture as unknown as VisualizationSpec).layers.filter((l) => {
    return (fixture.metadata.leftLayers as string[]).includes(l.id);
  }),
};

const rightSpec: VisualizationSpec = {
  ...(fixture as unknown as VisualizationSpec),
  layers: (fixture as unknown as VisualizationSpec).layers.filter((l) => {
    return (fixture.metadata.rightLayers as string[]).includes(l.id);
  }),
};

// Main story

/**
 * Two independent `GeoVisProvider` instances sharing the same data source.
 * The left panel displays territorial coverage (fill).
 * The right panel displays zone perimeters (line).
 * Movement is synchronised via `getNativeInstance()` — no additional package API needed.
 */
export const SplitCompare: StoryFn = () => {
  const leftMapRef = React.useRef<MapRef['current']>(null);
  const rightMapRef = React.useRef<MapRef['current']>(null);
  const syncLock = React.useRef(false) as LockRef;

  const recenter = () => {
    if (!splitCompareBbox) return;
    syncLock.current = true;
    for (const map of [leftMapRef.current, rightMapRef.current]) {
      map?.fitBounds(
        [
          [splitCompareBbox[0], splitCompareBbox[1]],
          [splitCompareBbox[2], splitCompareBbox[3]],
        ],
        { animate: false }
      );
    }
    syncLock.current = false;
  };

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };
  const panelStyle: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    border: '1px solid #d4d4d8',
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <strong>{fixture.title}</strong>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {fixture.description}
          </p>
        </div>
        <button
          onClick={recenter}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #d4d4d8',
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ⊙ Recenter
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, height: 480 }}>
        <div style={panelStyle}>
          <MapLabel>Territorial coverage (fill)</MapLabel>
          <GeoVisProvider spec={leftSpec}>
            <GeoVisCanvas viewId="left" style={canvasStyle} />
            <FitBoundsToBbox bbox={splitCompareBbox} />
            <MapSync
              selfRef={leftMapRef}
              peerRef={rightMapRef}
              lockRef={syncLock}
            />
          </GeoVisProvider>
        </div>

        <div style={panelStyle}>
          <MapLabel>Zone perimeters (line)</MapLabel>
          <GeoVisProvider spec={rightSpec}>
            <GeoVisCanvas viewId="right" style={canvasStyle} />
            <FitBoundsToBbox bbox={splitCompareBbox} />
            <MapSync
              selfRef={rightMapRef}
              peerRef={leftMapRef}
              lockRef={syncLock}
            />
          </GeoVisProvider>
        </div>
      </div>

      <div>
        <strong>Official references</strong>
        <ul>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/sync-movement-of-multiple-maps/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Sync movement of multiple maps
            </a>
          </li>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/change-a-layers-color-with-buttons/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre &mdash; Change a layer&apos;s color with buttons
              (setPaintProperty)
            </a>
          </li>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/add-a-geojson-polygon/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Add a GeoJSON polygon
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
