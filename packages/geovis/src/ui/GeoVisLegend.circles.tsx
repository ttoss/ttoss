import type * as React from 'react';

import type { SizeBy, VisualizationSpec } from '../spec/types';

export interface CircledLegendItem {
  label: string;
  radiusPx: number;
}

const CIRCLE_LEGEND_PERCENTS = [0.25, 0.5, 1] as const;

const computeCircleRadius = (
  value: number,
  scaleMaxValue: number,
  minRadius: number,
  maxRadius: number
): number => {
  if (value <= 0 || scaleMaxValue <= 0) return value <= 0 ? 0 : minRadius;
  const t =
    Math.sqrt(Math.min(value, scaleMaxValue)) / Math.sqrt(scaleMaxValue);
  return minRadius + (maxRadius - minRadius) * t;
};

export type ProportionalCirclesConfig = {
  scaleMaxValue: number;
  sizeBy: SizeBy;
};

export const findProportionalCirclesConfig = (
  spec: VisualizationSpec
): ProportionalCirclesConfig | null => {
  if (spec.scaleMaxValue == null) return null;
  for (const layer of spec.layers) {
    if (
      layer.sizeBy &&
      'transform' in layer.sizeBy &&
      layer.sizeBy.transform === 'sqrt'
    ) {
      return { scaleMaxValue: spec.scaleMaxValue, sizeBy: layer.sizeBy };
    }
  }
  return null;
};

export const buildCircledItems = (
  config: ProportionalCirclesConfig,
  formatValue: (value: number) => string
): CircledLegendItem[] => {
  const { scaleMaxValue, sizeBy } = config;
  const [minRadius, maxRadius] = sizeBy.range;
  return CIRCLE_LEGEND_PERCENTS.map((pct) => {
    const value = scaleMaxValue * pct;
    return {
      label:
        pct === 1 ? `\u2265 ${formatValue(scaleMaxValue)}` : formatValue(value),
      radiusPx: computeCircleRadius(value, scaleMaxValue, minRadius, maxRadius),
    };
  });
};

const MUTED_COLOR = '#6b7280';

const CIRCLE_SWATCH_BASE: React.CSSProperties = {
  backgroundColor: MUTED_COLOR,
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

/**
 * Renders the proportional-circle size key as a vertically stacked list.
 */
export const CirclesLegendItems = ({
  circleItems: items,
}: {
  circleItems: CircledLegendItem[];
}) => {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((c, i) => {
        const d = c.radiusPx * 2;
        return (
          <li key={`circle-${i}`} style={{ ...rowStyle, gap: 8 }}>
            <span
              aria-hidden="true"
              style={{ ...CIRCLE_SWATCH_BASE, height: d, width: d }}
            />
            <span>{c.label}</span>
          </li>
        );
      })}
    </>
  );
};
