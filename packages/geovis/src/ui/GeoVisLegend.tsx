import { Icon } from '@ttoss/react-icons';
import * as React from 'react';

import type { LegendSpec, VisualizationSpec } from '../spec/types';
import { useGeoVis } from './contexts';
import type { CircledLegendItem } from './GeoVisLegend.circles';
import {
  buildCircledItems,
  CirclesLegendItems,
  findProportionalCirclesConfig,
} from './GeoVisLegend.circles';
import type { LegendItem } from './GeoVisLegend.utils';
import {
  BORDER_COLOR,
  buildColorItems,
  buildContainerStyle,
  buildReferenceContent,
  collectLegendIdsForPosition,
  computeNormalizedBreaks,
  DESCRIPTION_COLOR,
  FONT_HEAD,
  FONT_MONO,
  footerSectionStyle,
  hasLegendContent,
  headerSectionStyle,
  MUTED_COLOR,
  resolveFormatter,
  resolveLegend,
  resolveSwatchColor,
  rowStyle,
  scaleSectionStyle,
  SECTION_DIVIDER,
  shouldShowCircleItems,
  swatchBase,
  TITLE_COLOR,
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

const titleTextStyle: React.CSSProperties = {
  fontFamily: FONT_HEAD,
  fontWeight: 600,
  fontSize: 15,
  color: TITLE_COLOR,
  lineHeight: 1.2,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 12,
  color: DESCRIPTION_COLOR,
  lineHeight: 1.55,
  margin: 0,
};

const referenceStyle: React.CSSProperties = {
  fontSize: 11,
  color: MUTED_COLOR,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/** Tinted rounded chip holding the legend's `@ttoss/react-icons` glyph. */
const IconChip = ({ icon, color }: { icon: string; color: string }) => {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 5,
        flexShrink: 0,
        backgroundColor: `${color}18`,
        color,
      }}
    >
      <Icon icon={icon} style={{ fontSize: 11, color }} />
    </span>
  );
};

const LegendTitleRow = ({
  icon,
  color,
  title,
  hasSubtitle,
}: {
  icon: string | undefined;
  color: string;
  title: string | undefined;
  hasSubtitle: boolean;
}) => {
  if (!icon && !title) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: hasSubtitle ? 5 : 0,
      }}
    >
      {!!icon && <IconChip icon={icon} color={color} />}
      {!!title && <span style={titleTextStyle}>{title}</span>}
    </div>
  );
};

const GeoVisLegendHeader = ({
  icon,
  iconColor,
  title,
  subtitle,
  hasContentBelow,
}: {
  icon: string | undefined;
  iconColor: string;
  title: string | undefined;
  subtitle: string | undefined;
  hasContentBelow: boolean;
}) => {
  if (!icon && !title && !subtitle) return null;
  return (
    <div
      style={{
        ...headerSectionStyle,
        ...(hasContentBelow
          ? { borderBottom: `1px solid ${SECTION_DIVIDER}` }
          : {}),
      }}
    >
      <LegendTitleRow
        icon={icon}
        color={iconColor}
        title={title}
        hasSubtitle={!!subtitle}
      />
      {!!subtitle && <p style={descriptionStyle}>{subtitle}</p>}
    </div>
  );
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
  referenceContent,
  extraStyle,
}: {
  className: string | undefined;
  legend: LegendSpec;
  items: LegendItem[];
  circleItems: CircledLegendItem[];
  referenceContent: React.ReactNode;
  extraStyle: React.CSSProperties | undefined;
}) => {
  const swatchColor = resolveSwatchColor(items, legend);
  const iconColor = legend.iconColor ?? swatchColor;
  const hasItems = items.length > 0 || circleItems.length > 0;
  const hasFooter = referenceContent != null || !!legend.footerValue;
  return (
    <div
      className={className}
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
      {hasItems && (
        <LegendScale
          legend={legend}
          items={items}
          circleItems={circleItems}
          swatchColor={swatchColor}
          hasFooter={hasFooter}
        />
      )}
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
  if (!hasLegendContent(effectiveLegend, items, circleItems)) return null;

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
      referenceContent={referenceContent}
      extraStyle={extraStyle}
    />
  );
};
