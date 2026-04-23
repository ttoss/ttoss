import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider } from '@ttoss/geovis';

export const GeoVisFixtureStory = ({
  spec,
  references,
}: {
  spec: VisualizationSpec;
  references?: { label: string; url: string }[];
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
