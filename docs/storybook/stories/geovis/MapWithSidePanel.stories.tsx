import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { PartialVisualizationSpec } from '@ttoss/geovis';
import {
  applyDefaults,
  GeoVisCanvas,
  GeoVisProvider,
  useGeoVis,
} from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import mapWithSidePanelMinimal from '../../../../packages/geovis/src/fixtures/map-with-side-panel.minimal.json';
import {
  applyBasemap,
  BASEMAP_ARG_TYPE,
  type BasemapArgs,
  DEFAULT_BASEMAP_ARGS,
} from './_map-story-helpers';

export default {
  title: 'GeoVis/Fixtures/MapWithSidePanel',
  tags: ['autodocs'],
  argTypes: BASEMAP_ARG_TYPE,
  args: DEFAULT_BASEMAP_ARGS,
} as Meta<BasemapArgs>;

const SIDEBAR_WIDTH = 300;

const sidebarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: SIDEBAR_WIDTH,
  background: 'white',
  borderRadius: 10,
  boxShadow: '0 0 50px -25px black',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  color: 'gray',
  transition: 'transform 1s',
  zIndex: 1,
};

const toggleButtonStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1.8em',
  height: '1.8em',
  background: 'white',
  borderRadius: 10,
  boxShadow: '0 0 50px -25px black',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 16,
  userSelect: 'none',
};

const SidePanels = () => {
  const { runtime } = useGeoVis();
  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);

  const toggle = (
    side: 'left' | 'right',
    isOpen: boolean,
    setOpen: (v: boolean) => void
  ) => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap;
    const nextOpen = !isOpen;
    setOpen(nextOpen);
    map.easeTo({
      padding: {
        left:
          side === 'left'
            ? nextOpen
              ? SIDEBAR_WIDTH
              : 0
            : leftOpen
              ? SIDEBAR_WIDTH
              : 0,
        right:
          side === 'right'
            ? nextOpen
              ? SIDEBAR_WIDTH
              : 0
            : rightOpen
              ? SIDEBAR_WIDTH
              : 0,
      },
      duration: 1000,
    });
  };

  return (
    <>
      <div
        style={{
          ...sidebarStyle,
          left: 0,
          transform: leftOpen ? 'translateX(0)' : 'translateX(-295px)',
        }}
      >
        Left Panel
        <div
          style={{ ...toggleButtonStyle, right: '-1.5em' }}
          onClick={() => {
            return toggle('left', leftOpen, setLeftOpen);
          }}
        >
          {leftOpen ? '←' : '→'}
        </div>
      </div>
      <div
        style={{
          ...sidebarStyle,
          right: 0,
          transform: rightOpen ? 'translateX(0)' : 'translateX(295px)',
        }}
      >
        Right Panel
        <div
          style={{ ...toggleButtonStyle, left: '-1.5em' }}
          onClick={() => {
            return toggle('right', rightOpen, setRightOpen);
          }}
        >
          {rightOpen ? '→' : '←'}
        </div>
      </div>
    </>
  );
};

// Minimal fixture (data only) — `applyDefaults` derives center/zoom from
// the inline focal-point feature; only the pitch is added here for the
// side-panel padding demo.
const mapWithSidePanelSpec: PartialVisualizationSpec = {
  ...(mapWithSidePanelMinimal as PartialVisualizationSpec),
  view: {
    ...applyDefaults(mapWithSidePanelMinimal as PartialVisualizationSpec).view,
    pitch: 60,
  },
};

export const MapWithSidePanel: StoryFn<BasemapArgs> = ({ basemapStyleUrl }) => {
  const activeSpec = React.useMemo(() => {
    return applyBasemap(mapWithSidePanelSpec, basemapStyleUrl);
  }, [basemapStyleUrl]);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>Map With Side Panel</strong>
        <p>
          Demonstrates collapsible side panels that adjust the map&apos;s
          padding so the focal point stays centered in the visible area.
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 560,
          border: '1px solid #d4d4d8',
          overflow: 'hidden',
        }}
      >
        <GeoVisProvider spec={activeSpec}>
          <GeoVisCanvas
            viewId="primary"
            style={{ width: '100%', height: '100%' }}
          />
          <SidePanels />
        </GeoVisProvider>
      </div>
      <div>
        <strong>Official references</strong>
        <ul>
          <li>
            <a
              href="https://maplibre.org/maplibre-gl-js/docs/examples/offset-the-vanishing-point-using-padding/"
              target="_blank"
              rel="noreferrer"
            >
              MapLibre — Offset the vanishing point using padding
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
