/**
 * Choropleth-specific story helpers shared across GeoVis stories.
 * Not public package artefacts — story utilities only.
 */
// ---------------------------------------------------------------------------
// ColorStep
// ---------------------------------------------------------------------------

export interface ColorStep {
  threshold: number;
  color: string;
}

// ---------------------------------------------------------------------------
// MapOverlayLegend
// ---------------------------------------------------------------------------

/**
 * Gradient overlay positioned below the MapLabel (top-left of the panel).
 * Must be a direct child of a div with `position: relative` (the map panel);
 * does not need to be inside a GeoVisProvider.
 *
 * [cartography] Robinson & Slocum "Thematic Cartography" ch. 18:
 * In side-by-side comparison maps, the legend should be grouped with the
 * corresponding layer label, forming a cohesive informational block that
 * the reader processes BEFORE exploring the data — the pattern followed by
 * ESRI StoryMaps and ArcGIS Dashboards.
 * `top: 40` anchors the overlay immediately below the MapLabel (~32px tall).
 * Bottom-left (ILC) is preferred for isolated maps, but in split-compare
 * top-left groups label + scale and avoids overlap with MapLibre's
 * attribution bar (bottom-right).
 */
export const MapOverlayLegend = ({
  label,
  defaultColor,
  steps,
  formatValue,
}: {
  label?: string;
  defaultColor: string;
  steps: ColorStep[];
  formatValue?: (v: number) => string;
}) => {
  const colors = [
    defaultColor,
    ...steps.map((s) => {
      return s.color;
    }),
  ];
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
  const fmt =
    formatValue ??
    ((v: number) => {
      return String(v);
    });
  const minLabel = `< ${fmt(steps[0].threshold)}`;
  const maxLabel = `> ${fmt(steps[steps.length - 1].threshold)}`;

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 8,
        zIndex: 1,
        pointerEvents: 'none',
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 4,
        padding: '5px 8px',
        minWidth: 130,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 3,
          }}
        >
          {label}
        </div>
      )}
      <div style={{ height: 8, background: gradient, borderRadius: 2 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 9, color: '#6b7280' }}>{minLabel}</span>
        <span style={{ fontSize: 9, color: '#6b7280' }}>{maxLabel}</span>
      </div>
    </div>
  );
};
