import * as React from 'react';

import { resolveDensityLegendColors } from '../spec/heatmap';
import type { LegendSpec, VisualizationSpec } from '../spec/types';
import { useGeoVis } from './contexts';
import type { CircledLegendItem } from './GeoVisLegend.circles';
import {
  buildCircledItems,
  CirclesLegendItems,
  findProportionalCirclesConfig,
} from './GeoVisLegend.circles';
import { DensityGradient, resolveLegendScale } from './GeoVisLegend.gradient';
import { GeoVisLegendHeader } from './GeoVisLegend.header';
import type { LegendItem } from './GeoVisLegend.utils';
import {
  BORDER_COLOR,
  buildColorItems,
  buildContainerStyle,
  buildReferenceContent,
  collectLegendIdsForPosition,
  computeNormalizedBreaks,
  FONT_MONO,
  footerSectionStyle,
  hasLegendContent,
  MUTED_COLOR,
  resolveFormatter,
  resolveLegend,
  rowStyle,
  scaleSectionStyle,
  SECTION_DIVIDER,
  shouldShowCircleItems,
  swatchBase,
} from './GeoVisLegend.utils';

export { parseReference } from './GeoVisLegend.utils';

export interface GeoVisLegendProps {
  /** Id of the legend to resolve from the spec's legend registry. */
  legendId: string;
  /** Explicit break points; overrides the legend's own `thresholds`. */
  breaks?: number[];
  /**
   * Formats numeric bin/circle values for display. When omitted, the default
   * is the locale formatter for choropleth/categorical legends and the compact
   * formatter (e.g. `500k`) for proportional-circle legends.
   */
  formatValue?: (value: number) => string;
  /** Optional class applied to the legend container. */
  className?: string;
  /** Optional node rendered as the legend's reference/attribution footer. */
  sourceNode?: React.ReactNode;
  /**
   * When true, renders without the absolute-positioning wrapper even if the
   * legend declares a `position`. Used by `GeoVisProvider` to stack every
   * legend sharing a position inside one grouped overlay container.
   */
  noPositionWrap?: boolean;
  /**
   * When true, the card drops its fixed width and fills its container. Used by
   * the compact legend panel, which spans the map from side to side — without
   * this the card would keep its own width inside that full-width panel.
   */
  stretch?: boolean;
}

const useGeoVisLegend = (spec: VisualizationSpec, legendId: string) => {
  return React.useMemo(() => {
    return resolveLegend(spec, legendId);
  }, [spec, legendId]);
};

const swatchLabelStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 11,
  color: MUTED_COLOR,
  lineHeight: 1.3,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

/**
 * The reference wraps to a second line before it is cut, with an ellipsis at
 * the end of that line: a source and its links rarely fit one line of the
 * card, and a single line left most of them out.
 */
const referenceStyle: React.CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  color: MUTED_COLOR,
  flex: 1,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
};

const GeoVisLegendItems = ({
  items,
  legendId,
  noDataLabel,
}: {
  items: LegendItem[];
  legendId: string;
  noDataLabel: string | undefined;
}) => {
  return (
    <>
      {items.map((item) => {
        return (
          <li key={`${legendId}-${item.binIndex}`} style={rowStyle}>
            <span
              aria-hidden="true"
              style={{
                ...swatchBase,
                backgroundColor: item.color,
                border: `1px solid ${BORDER_COLOR}`,
              }}
            />
            <span style={swatchLabelStyle}>{item.label}</span>
          </li>
        );
      })}
      {!!noDataLabel && (
        <li style={rowStyle}>
          <span
            aria-hidden="true"
            style={{
              ...swatchBase,
              backgroundColor: 'transparent',
              border: '1px solid #9ca3af',
            }}
          />
          <span style={swatchLabelStyle}>{noDataLabel}</span>
        </li>
      )}
    </>
  );
};

const GeoVisLegendItemsDivider = ({
  itemsCount,
  circleItemsCount,
}: {
  itemsCount: number;
  circleItemsCount: number;
}) => {
  if (itemsCount === 0 || circleItemsCount === 0) return null;
  return (
    <li
      aria-hidden="true"
      style={{
        borderTop: `1px solid ${BORDER_COLOR}`,
        margin: '4px 0',
        width: '100%',
      }}
    />
  );
};

const LegendScale = ({
  legend,
  items,
  circleItems,
  swatchColor,
  hasFooter,
}: {
  legend: LegendSpec;
  items: LegendItem[];
  circleItems: CircledLegendItem[];
  swatchColor: string;
  hasFooter: boolean;
}) => {
  return (
    <ul
      aria-label={legend.title ?? legend.id}
      style={{
        ...listStyle,
        ...scaleSectionStyle,
        ...(hasFooter ? { borderBottom: `1px solid ${SECTION_DIVIDER}` } : {}),
      }}
    >
      <GeoVisLegendItems
        items={items}
        legendId={legend.id}
        noDataLabel={legend.noDataLabel}
      />
      <GeoVisLegendItemsDivider
        itemsCount={items.length}
        circleItemsCount={circleItems.length}
      />
      <CirclesLegendItems circleItems={circleItems} swatchColor={swatchColor} />
    </ul>
  );
};

const LegendFooter = ({
  referenceContent,
  footerValue,
  swatchColor,
}: {
  referenceContent: React.ReactNode;
  footerValue: string | undefined;
  swatchColor: string;
}) => {
  return (
    <div style={footerSectionStyle}>
      {referenceContent != null && (
        <span style={referenceStyle}>{referenceContent}</span>
      )}
      {!!footerValue && (
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            fontWeight: 500,
            color: swatchColor,
            flexShrink: 0,
          }}
        >
          {footerValue}
        </span>
      )}
    </div>
  );
};

const GeoVisLegendBody = ({
  className,
  legend,
  items,
  circleItems,
  densityColors,
  referenceContent,
  extraStyle,
}: {
  className: string | undefined;
  legend: LegendSpec;
  items: LegendItem[];
  circleItems: CircledLegendItem[];
  densityColors: string[] | undefined;
  referenceContent: React.ReactNode;
  extraStyle: React.CSSProperties | undefined;
}) => {
  const { swatchColor, hasItems } = resolveLegendScale({
    legend,
    items,
    circleItems,
    densityColors,
  });
  const iconColor = legend.iconColor ?? swatchColor;
  const hasFooter = referenceContent != null || !!legend.footerValue;
  return (
    <div
      className={className}
      // Public hook: lets a caller find the rendered cards — the workspace's
      // map export captures them into the image.
      data-geovis-legend={legend.id}
      style={{
        ...buildContainerStyle(legend.position, legend.offset),
        ...extraStyle,
      }}
    >
      <GeoVisLegendHeader
        icon={legend.icon}
        iconColor={iconColor}
        title={legend.title}
        subtitle={legend.subtitle}
        hasContentBelow={hasItems || hasFooter}
      />
      {hasItems &&
        (densityColors ? (
          <DensityGradient
            legend={legend}
            colors={densityColors}
            hasFooter={hasFooter}
          />
        ) : (
          <LegendScale
            legend={legend}
            items={items}
            circleItems={circleItems}
            swatchColor={swatchColor}
            hasFooter={hasFooter}
          />
        ))}
      {hasFooter && (
        <LegendFooter
          referenceContent={referenceContent}
          footerValue={legend.footerValue}
          swatchColor={swatchColor}
        />
      )}
    </div>
  );
};

export const GeoVisLegend = ({
  legendId,
  breaks,
  formatValue,
  className,
  sourceNode,
  noPositionWrap = false,
  stretch = false,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();

  const legend = useGeoVisLegend(spec, legendId);
  const normalizedBreaks = React.useMemo(() => {
    return computeNormalizedBreaks(breaks, legend);
  }, [breaks, legend]);
  const circleConfig = React.useMemo(() => {
    return findProportionalCirclesConfig(spec);
  }, [spec]);
  const resolvedFormatValue = React.useMemo(() => {
    return resolveFormatter(formatValue, circleConfig);
  }, [formatValue, circleConfig]);

  const items = React.useMemo(() => {
    return buildColorItems(legend, normalizedBreaks, resolvedFormatValue, spec);
  }, [legend, normalizedBreaks, resolvedFormatValue, spec]);

  const circleItems = React.useMemo(() => {
    if (!shouldShowCircleItems(circleConfig, legend, spec)) return [];
    return buildCircledItems(circleConfig!, resolvedFormatValue);
  }, [circleConfig, resolvedFormatValue, legend, spec]);

  const densityColors = React.useMemo(() => {
    return legend ? resolveDensityLegendColors(spec, legend) : undefined;
  }, [legend, spec]);

  /**
   * When several legends stack inside one shared position group, every card
   * after the first gets a top margin so the cards don't touch.
   */
  const isFirstInPositionGroup = React.useMemo(() => {
    if (!noPositionWrap || !legend?.position) return true;
    return collectLegendIdsForPosition(spec, legend.position)[0] === legendId;
  }, [spec, legend, legendId, noPositionWrap]);

  /**
   * Effective legend object passed to render functions. When `noPositionWrap`
   * is true, position is cleared so `GeoVisLegendBody` renders in normal flow
   * (the group container handles positioning).
   */
  const effectiveLegend: LegendSpec | undefined = React.useMemo(() => {
    if (!legend || !noPositionWrap) return legend;
    return { ...legend, position: undefined };
  }, [legend, noPositionWrap]);

  if (!effectiveLegend) return null;
  if (
    !densityColors?.length &&
    !hasLegendContent(effectiveLegend, items, circleItems)
  ) {
    return null;
  }

  const referenceContent = buildReferenceContent(sourceNode, effectiveLegend);

  // `marginTop` separates stacked cards; `width` lets the card fill a panel
  // that is itself wider than the card's own fixed width.
  const extraStyle: React.CSSProperties = {
    ...(isFirstInPositionGroup ? {} : { marginTop: 8 }),
    ...(stretch ? { width: '100%' } : {}),
  };

  return (
    <GeoVisLegendBody
      className={className}
      legend={effectiveLegend}
      items={items}
      circleItems={circleItems}
      densityColors={densityColors}
      referenceContent={referenceContent}
      extraStyle={extraStyle}
    />
  );
};
