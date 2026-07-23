import { vars } from '@ttoss/fsl-theme/vars';
import {
  Badge,
  Grid,
  Heading,
  Meter,
  Stack,
  Surface,
  Text,
} from '@ttoss/fsl-ui';
import type * as React from 'react';

import { studioVars } from '../theme';

/*
 * The chart below is a bespoke widget — no fsl-ui primitive covers charts,
 * by design: analytical rendering is the job of the dataviz token family
 * (`semantic.dataviz.*`), which any renderer consumes. Every colour, dash
 * pattern, and opacity in the SVG resolves from tokens; geometry literals
 * are chart-internal and named below (CONTRIBUTING §4 pattern). Grid lines
 * and axis labels deliberately reuse the foundation (`informational.muted`)
 * — the dataviz architecture defines no parallel grid/axis vocabulary.
 */

const KPIS = [
  {
    label: 'Active members',
    value: '128',
    delta: '+12%',
    evaluation: 'positive',
  },
  { label: 'Projects', value: '32', delta: '+4%', evaluation: 'positive' },
  {
    label: 'Deploys this week',
    value: '87',
    delta: '−9%',
    evaluation: 'caution',
  },
  { label: 'Failed checks', value: '6', delta: '+3', evaluation: 'negative' },
] as const;

const WEEKS = [
  { label: 'W27', production: 34, preview: 51 },
  { label: 'W28', production: 41, preview: 46 },
  { label: 'W29', production: 38, preview: 58 },
  { label: 'W30', production: 46, preview: 61 },
  { label: 'W31', production: 30, preview: 44 },
  { label: 'W32', production: 52, preview: 66 },
  { label: 'W33', production: 47, preview: 59 },
  { label: 'W34', production: 55, preview: 72 },
] as const;

/** Weekly production-deploy target the reference line marks. */
const TARGET = 48;

// Chart-internal geometry (SVG user units; the SVG scales to its container).
const CHART_W = 640;
const CHART_H = 200; // plot area block-size (bars bottom out here)
const LABEL_BAND = 26; // block-size reserved under the plot for week labels
const SVG_H = CHART_H + LABEL_BAND;
const CHART_PAD_TOP = 12;
const GROUP_GAP = 18; // gap between week groups
const BAR_GAP = 4; // gap between the two series bars in a group
const BAR_RADIUS = 2;
const Y_MAX = 80; // fixed scale ceiling (> max value, round number)
const GRID_STEPS = 4;

// Label size in SVG user units. The viewBox scale divides the rendered
// size, so token rem sizes do not survive — inside a scaled SVG, font
// size is chart geometry, not typography.
const LABEL_FONT_UNITS = 20;

const plotHeight = CHART_H - CHART_PAD_TOP;
const groupWidth = CHART_W / WEEKS.length;
const barWidth = (groupWidth - GROUP_GAP - BAR_GAP) / 2;

const yFor = (value: number): number => {
  return CHART_H - (value / Y_MAX) * plotHeight;
};

/** Series legend swatch — a token-coloured square (chart-internal chrome). */
const LegendSwatch = ({ color }: { color: string }) => {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        inlineSize: '0.625rem',
        blockSize: '0.625rem',
        borderRadius: vars.radii.control,
        backgroundColor: color,
      }}
    />
  );
};

/**
 * Grouped bar chart of weekly deploys, drawn directly with SVG on the
 * dataviz tokens: categorical `color.series.*` for the bars,
 * `color.reference.target` + `encoding.stroke.reference` for the dashed
 * target line, foundation `informational.muted` for grid lines.
 */
const DeploysChart = () => {
  const series1 = studioVars.dataviz.color.series[1];
  const series2 = studioVars.dataviz.color.series[2];
  const gridStroke = vars.colors.informational.muted.border?.default;

  return (
    <Stack gap="sm">
      <Stack direction="horizontal" gap="lg" align="center">
        <Stack direction="horizontal" gap="sm" align="center">
          <LegendSwatch color={series1} />
          <Text as="span" variant="label-sm" tone="muted">
            Production
          </Text>
        </Stack>
        <Stack direction="horizontal" gap="sm" align="center">
          <LegendSwatch color={series2} />
          <Text as="span" variant="label-sm" tone="muted">
            Preview
          </Text>
        </Stack>
        <Stack direction="horizontal" gap="sm" align="center">
          <svg
            aria-hidden
            width="16"
            height="10"
            viewBox="0 0 16 10"
            style={{ display: 'block' }}
          >
            <line
              x1="0"
              y1="5"
              x2="16"
              y2="5"
              style={{
                stroke: studioVars.dataviz.color.reference.target,
                strokeWidth: 2,
                strokeDasharray: studioVars.dataviz.encoding.stroke.reference,
              }}
            />
          </svg>
          <Text as="span" variant="label-sm" tone="muted">
            Target ({TARGET}/week)
          </Text>
        </Stack>
      </Stack>
      <svg
        role="img"
        aria-label={`Deploys per week over the last ${WEEKS.length} weeks, production versus preview, with a production target of ${TARGET} per week.`}
        viewBox={`0 0 ${CHART_W} ${SVG_H}`}
        style={{ display: 'block', inlineSize: '100%', blockSize: 'auto' }}
      >
        {Array.from({ length: GRID_STEPS }, (_, index) => {
          const y = yFor(((index + 1) * Y_MAX) / GRID_STEPS);
          return (
            <line
              key={index}
              x1={0}
              y1={y}
              x2={CHART_W}
              y2={y}
              style={{ stroke: gridStroke, strokeWidth: 1 }}
            />
          );
        })}
        {WEEKS.map((week, index) => {
          const groupStart = index * groupWidth + GROUP_GAP / 2;
          return (
            <g key={week.label}>
              <rect
                data-series="production"
                x={groupStart}
                y={yFor(week.production)}
                width={barWidth}
                height={CHART_H - yFor(week.production)}
                rx={BAR_RADIUS}
                style={{ fill: series1 }}
              />
              <rect
                data-series="preview"
                x={groupStart + barWidth + BAR_GAP}
                y={yFor(week.preview)}
                width={barWidth}
                height={CHART_H - yFor(week.preview)}
                rx={BAR_RADIUS}
                style={{ fill: series2 }}
              />
            </g>
          );
        })}
        <line
          data-reference="target"
          x1={0}
          y1={yFor(TARGET)}
          x2={CHART_W}
          y2={yFor(TARGET)}
          style={{
            stroke: studioVars.dataviz.color.reference.target,
            strokeWidth: 1.5,
            strokeDasharray: studioVars.dataviz.encoding.stroke.reference,
          }}
        />
        {/* Week labels live inside the SVG, anchored to each group's
            center, so they stay aligned with the bars at any width. */}
        {WEEKS.map((week, index) => {
          return (
            <text
              key={week.label}
              x={(index + 0.5) * groupWidth}
              y={SVG_H - 8}
              textAnchor="middle"
              style={
                {
                  fill: vars.colors.informational.muted.text?.default,
                  fontFamily: vars.text.label.sm.fontFamily,
                  fontSize: LABEL_FONT_UNITS,
                } as React.CSSProperties
              }
            >
              {week.label}
            </text>
          );
        })}
      </svg>
    </Stack>
  );
};

/**
 * Block: an analytics dashboard section — KPI tiles, a grouped bar chart
 * drawn on the dataviz tokens (first real consumer of
 * `semantic.dataviz.*`), and capacity meters. Deltas use Badge's Feedback
 * valences (a delta is genuinely evaluative).
 */
export const DashboardBlock = () => {
  return (
    <Surface level="raised" padding="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Heading level={4} size="title-sm">
            Workspace analytics
          </Heading>
          <Text variant="body-sm" tone="muted">
            Last 8 weeks, all projects.
          </Text>
        </Stack>
        <Grid minColumnWidth="xs" gap="md">
          {KPIS.map((kpi) => {
            return (
              <Surface key={kpi.label} level="flat" padding="md">
                <Stack gap="xs">
                  <Text as="span" variant="label-sm" tone="muted">
                    {kpi.label}
                  </Text>
                  <Stack direction="horizontal" gap="sm" align="center">
                    <Text as="span" variant="display-sm" numeric="tabular">
                      {kpi.value}
                    </Text>
                    <Badge evaluation={kpi.evaluation} numeric="tabular">
                      {kpi.delta}
                    </Badge>
                  </Stack>
                </Stack>
              </Surface>
            );
          })}
        </Grid>
        <Grid minColumnWidth="lg" gap="lg" align="start">
          <Surface level="flat" padding="lg">
            <Stack gap="md">
              <Heading level={5} size="title-sm">
                Deploys per week
              </Heading>
              <DeploysChart />
            </Stack>
          </Surface>
          <Surface level="flat" padding="lg">
            <Stack gap="md">
              <Heading level={5} size="title-sm">
                Capacity
              </Heading>
              <Meter label="Storage used" value={62} />
              <Meter
                label="Seats used"
                value={128}
                maxValue={150}
                evaluation="caution"
                valueLabel="128 of 150"
              />
            </Stack>
          </Surface>
        </Grid>
      </Stack>
    </Surface>
  );
};
