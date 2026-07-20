import type { GeoVisIssue } from '@ttoss/geovis';

/**
 * Renders the cartography policy warning banner from `useGeoVis().result`'s
 * `warnings` (a `resolved` result's `GeoVisIssue[]`, code `policy-violation`)
 * — the GeoVisResult taxonomy (ADR-0001) replaced the retired
 * `policyViolations`/`PolicyViolation` reporting path.
 */
export const PolicyWarningBanner = ({
  warnings,
}: {
  warnings: GeoVisIssue[];
}) => {
  if (warnings.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        background: '#fffbeb',
        border: '1px solid #f59e0b',
        borderLeft: '4px solid #d97706',
        borderRadius: 6,
        padding: '12px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
      <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
        <strong style={{ display: 'block', marginBottom: 4 }}>
          Cartographic guardrail: absolute count in choropleth
        </strong>
        Rwanda provinces encoded by <strong>absolute population count</strong>{' '}
        (left) vs <strong>density</strong> (hab/km², right). Kigali has a small
        population (854K) yet is the densest province (1,551 hab/km²). On the
        left map Kigali appears almost white; on the right it is the darkest.
        <br />
        <strong>Correct:</strong> divide by area before encoding in colour.
        {warnings.map((w) => {
          return (
            <span
              key={w.subject.id ?? w.code}
              style={{
                display: 'block',
                marginTop: 4,
                fontFamily: 'monospace',
                fontSize: 11,
              }}
            >
              [{w.code}] {w.subject.id ? `(${w.subject.id})` : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const StoryHeader = ({
  title,
  description,
  onRecenter,
}: {
  title: string;
  description: string;
  onRecenter: () => void;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <strong>{title}</strong>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {description}
        </p>
      </div>
      <button
        onClick={onRecenter}
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
        Recenter
      </button>
    </div>
  );
};
