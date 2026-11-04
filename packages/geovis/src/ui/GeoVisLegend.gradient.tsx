import { defineMessages, useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import type { DensityColorBy, LegendSpec } from '../spec/types';
import type { CircledLegendItem } from './GeoVisLegend.circles';
import {
  BORDER_COLOR,
  FONT_MONO,
  type LegendItem,
  MUTED_COLOR,
  resolveSwatchColor,
  scaleSectionStyle,
  SECTION_DIVIDER,
} from './GeoVisLegend.utils';

const messages = defineMessages({
  low: {
    defaultMessage: 'Less',
    description:
      'Map legend: label under the low end of a heatmap density gradient.',
  },
  high: {
    defaultMessage: 'More',
    description:
      'Map legend: label under the high end of a heatmap density gradient.',
  },
  gradient: {
    defaultMessage: '{title}: {low} to {high}',
    description:
      'Map legend: accessible name of a heatmap density gradient. "title" is the legend title; "low" and "high" label its ends.',
  },
});

const labelStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 11,
  color: MUTED_COLOR,
  lineHeight: 1.3,
};

/**
 * The CSS gradient of a density ramp, lowest density on the left. It starts
 * at the first colour, not transparent: the bar shows the colours the heat is
 * drawn in, and an empty map already reads as "none".
 */
export const densityGradientCss = (colors: ReadonlyArray<string>): string => {
  const stops = colors.length === 1 ? [colors[0], colors[0]] : colors;
  return `linear-gradient(to right, ${stops.join(', ')})`;
};

/**
 * The legend card's accent colour and whether it has a scale to draw. A
 * density legend has no swatches: its accent is the hottest colour, and its
 * gradient is its scale.
 */
export const resolveLegendScale = ({
  legend,
  items,
  circleItems,
  densityColors,
}: {
  legend: LegendSpec;
  items: LegendItem[];
  circleItems: CircledLegendItem[];
  densityColors: string[] | undefined;
}): { swatchColor: string; hasItems: boolean } => {
  if (densityColors?.length) {
    return {
      swatchColor: densityColors[densityColors.length - 1],
      hasItems: true,
    };
  }
  return {
    swatchColor: resolveSwatchColor(items, legend),
    hasItems: items.length > 0 || circleItems.length > 0,
  };
};

/**
 * A density legend's scale: a continuous bar in the heatmap's colours, with
 * the low and high labels under its ends.
 */
export const DensityGradient = ({
  legend,
  colors,
  hasFooter,
}: {
  legend: LegendSpec;
  colors: string[];
  hasFooter: boolean;
}) => {
  const { intl } = useI18n();
  const colorBy: Partial<DensityColorBy> =
    legend.colorBy?.type === 'density' ? legend.colorBy : {};
  const low = colorBy.lowLabel ?? intl.formatMessage(messages.low);
  const high = colorBy.highLabel ?? intl.formatMessage(messages.high);
  return (
    <div
      role="img"
      aria-label={intl.formatMessage(messages.gradient, {
        title: legend.title ?? legend.id,
        low,
        high,
      })}
      style={{
        ...scaleSectionStyle,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        ...(hasFooter ? { borderBottom: `1px solid ${SECTION_DIVIDER}` } : {}),
      }}
    >
      <span
        aria-hidden="true"
        data-geovis-density-gradient=""
        style={{
          display: 'block',
          height: 12,
          borderRadius: 3,
          border: `1px solid ${BORDER_COLOR}`,
          backgroundImage: densityGradientCss(colors),
        }}
      />
      <span
        aria-hidden="true"
        style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}
      >
        <span style={labelStyle}>{low}</span>
        <span style={labelStyle}>{high}</span>
      </span>
    </div>
  );
};
