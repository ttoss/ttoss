import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

import type { Bbox } from './helpers/map-story-helpers';
import {
  FitBoundsToBbox,
  FitBoundsToUrlSource,
} from './helpers/map-story-helpers';

/**
 * Generic fixture story shell.
 * - Pass `bbox` for inline GeoJSON sources (bbox pre-computed at module load).
 * - Pass `sourceUrl` for remote GeoJSON sources (bbox computed after fetch).
 */
export const GeoVisFixtureStory = ({
  spec,
  references,
  bbox,
  sourceUrl,
}: {
  spec: VisualizationSpec;
  references?: { label: string; url: string }[];
  /** Pre-computed bounding box for inline GeoJSON sources. */
  bbox?: Bbox | null;
  /** URL of a remote GeoJSON source; bbox is computed after the fetch resolves. */
  sourceUrl?: string;
}) => {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{spec.title}</strong>
        {spec.description ? <p>{spec.description}</p> : null}
      </div>
      <div style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}>
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas viewId="primary" />
          {sourceUrl != null ? (
            <FitBoundsToUrlSource url={sourceUrl} />
          ) : bbox != null ? (
            <FitBoundsToBbox bbox={bbox} />
          ) : null}
        </GeoVisProvider>
      </div>
      {references && references.length > 0 ? (
        <div>
          <strong>Official references (with anchors)</strong>
          <ul>
            {references.map((ref) => {
              return (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noreferrer">
                    {ref.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
