import { datavizVars } from '@ttoss/fsl-theme/dataviz';
import { vars } from '@ttoss/fsl-theme/vars';
import type { SortDescriptor } from '@ttoss/fsl-ui';
import {
  Code,
  Grid,
  Heading,
  Stack,
  StatusLight,
  Surface,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
} from '@ttoss/fsl-ui';
import * as React from 'react';

import type { Deploy, DeployStatus } from '../data';
import { DEPLOYS, KPIS, WEEKLY_DEPLOYS } from '../data';

const STATUS_BADGE: Record<
  DeployStatus,
  { label: string; evaluation: 'positive' | 'caution' | 'negative' }
> = {
  ready: { label: 'Ready', evaluation: 'positive' },
  building: { label: 'Building', evaluation: 'caution' },
  failed: { label: 'Failed', evaluation: 'negative' },
};

export const formatDuration = (seconds: number | null): string => {
  if (seconds === null) {
    return '—';
  }
  return `${seconds}s`;
};

export const formatAge = (minutesAgo: number): string => {
  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`;
  }
  return `${Math.round(minutesAgo / 60)}h ago`;
};

/**
 * Deploys-per-day bar chart — the Stage's one bespoke widget. No fsl-ui
 * primitive covers charts (BLUEPRINT D-002 names this the canonical `vars`
 * case): every colour/radius below is a literal `var(--tt-*)` reference;
 * the numeric geometry is the data encoding itself, which no token can
 * express.
 */
const DeployActivityChart = () => {
  const max = Math.max(
    ...WEEKLY_DEPLOYS.map((entry) => {
      return entry.count;
    })
  );
  const total = WEEKLY_DEPLOYS.reduce((sum, entry) => {
    return sum + entry.count;
  }, 0);

  return (
    <div
      role="img"
      aria-label={`Deploys per day over the last week: ${WEEKLY_DEPLOYS.map(
        (entry) => {
          return `${entry.day} ${entry.count}`;
        }
      ).join(', ')}. Total ${total}.`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${WEEKLY_DEPLOYS.length}, 1fr)`,
        gap: vars.spacing.gap.inline.md,
        alignItems: 'end',
        blockSize: '11rem',
      }}
    >
      {WEEKLY_DEPLOYS.map((entry) => {
        return (
          <div
            key={entry.day}
            style={{
              display: 'grid',
              gridTemplateRows: '1fr auto auto',
              alignItems: 'end',
              justifyItems: 'center',
              gap: vars.spacing.gap.stack.xs,
              blockSize: '100%',
            }}
          >
            <div
              style={{
                inlineSize: '100%',
                blockSize: `${Math.round((entry.count / max) * 100)}%`,
                minBlockSize: '2px',
                backgroundColor: datavizVars.color.series[1],
                borderRadius: vars.radii.control,
              }}
            />
            <Text variant="label-sm" numeric="tabular">
              {entry.count}
            </Text>
            <Text variant="label-sm" tone="muted">
              {entry.day}
            </Text>
          </div>
        );
      })}
    </div>
  );
};

const KpiTiles = () => {
  return (
    <Grid minColumnWidth="xs" gap="md">
      {KPIS.map((kpi) => {
        return (
          <Surface key={kpi.id} level="raised" padding="md">
            <Stack gap="sm">
              {/*
               * Delta badge rides the label row (justify between, wrap as
               * safety) so the display-scale value never competes for inline
               * space in narrow tracks. Grid items are size containers
               * (fsl-ui ADR-011, from FRICTION F-018), so the tile's type and
               * inset scale to the track.
               */}
              <Stack
                direction="horizontal"
                align="center"
                justify="between"
                gap="sm"
                wrap
              >
                <Text variant="label-sm" tone="muted">
                  {kpi.label}
                </Text>
                <StatusLight
                  evaluation={
                    kpi.deltaTone === 'positive' ? 'positive' : 'negative'
                  }
                  numeric="tabular"
                >
                  {kpi.delta}
                </StatusLight>
              </Stack>
              <Text variant="display-sm" numeric="tabular">
                {kpi.value}
              </Text>
            </Stack>
          </Surface>
        );
      })}
    </Grid>
  );
};

const sortDeploys = (deploys: Deploy[], descriptor: SortDescriptor) => {
  const sorted = [...deploys].sort((a, b) => {
    switch (descriptor.column) {
      case 'project':
        return a.project.localeCompare(b.project);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'age':
        return a.minutesAgo - b.minutesAgo;
      default:
        return 0;
    }
  });
  return descriptor.direction === 'descending' ? sorted.reverse() : sorted;
};

const RecentDeploys = () => {
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'age',
    direction: 'ascending',
  });

  const sorted = sortDeploys(DEPLOYS, sortDescriptor);

  return (
    <Table
      aria-label="Recent deploys"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        <TableColumn id="project" isRowHeader allowsSorting>
          Project
        </TableColumn>
        <TableColumn id="status" allowsSorting>
          Status
        </TableColumn>
        <TableColumn id="source">Source</TableColumn>
        <TableColumn id="duration">Duration</TableColumn>
        <TableColumn id="age" allowsSorting>
          Deployed
        </TableColumn>
        <TableColumn id="actor">By</TableColumn>
      </TableHeader>
      <TableBody>
        {sorted.map((deploy) => {
          const status = STATUS_BADGE[deploy.status];
          return (
            <TableRow key={deploy.id} id={deploy.id}>
              <TableCell>{deploy.project}</TableCell>
              <TableCell>
                <StatusLight evaluation={status.evaluation}>
                  {status.label}
                </StatusLight>
              </TableCell>
              <TableCell>
                <Code>{`${deploy.branch}@${deploy.commit}`}</Code>
              </TableCell>
              <TableCell>
                <Text variant="body-sm" numeric="tabular">
                  {formatDuration(deploy.duration)}
                </Text>
              </TableCell>
              <TableCell>
                <Text variant="body-sm" numeric="tabular">
                  {formatAge(deploy.minutesAgo)}
                </Text>
              </TableCell>
              <TableCell>{deploy.actor}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

/** Overview — the workspace pulse: KPIs, weekly activity, recent deploys. */
export const DashboardPage = () => {
  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Heading level={1} size="headline-sm">
          Overview
        </Heading>
        <Text tone="muted">
          Deploy activity across northline&apos;s projects.
        </Text>
      </Stack>
      <KpiTiles />
      <Surface level="raised" padding="lg">
        <Stack gap="lg">
          <Stack gap="xs">
            <Text variant="label-lg">Deploys this week</Text>
            <Text variant="body-sm" tone="muted">
              90 production deploys across 5 projects
            </Text>
          </Stack>
          <DeployActivityChart />
        </Stack>
      </Surface>
      <Stack gap="md">
        <Heading level={2} size="title-sm">
          Recent deploys
        </Heading>
        <RecentDeploys />
      </Stack>
    </Stack>
  );
};
