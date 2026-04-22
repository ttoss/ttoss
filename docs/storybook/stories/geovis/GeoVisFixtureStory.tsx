import type { PartialVisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

import { applyBasemap } from './_map-story-helpers';

export const GeoVisFixtureStory = ({
  spec,
  title,
  description,
  references,
  basemapStyleUrl,
}: {
  spec: PartialVisualizationSpec;
  title?: string;
  description?: string;
  references?: { label: string; url: string }[];
  /** When provided, overrides `spec.basemap.styleUrl`. */
  basemapStyleUrl?: string;
}) => {
  const activeSpec = basemapStyleUrl
    ? applyBasemap(spec, basemapStyleUrl)
    : spec;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {(title ?? description) ? (
        <div>
          {title ? <strong>{title}</strong> : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      <div style={{ width: '100%', height: 560, border: '1px solid #d4d4d8' }}>
        <GeoVisProvider spec={activeSpec}>
          <GeoVisCanvas viewId="primary" />
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
