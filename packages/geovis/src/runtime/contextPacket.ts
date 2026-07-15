import type { GeoVisIssue, GeoVisResult } from '../spec/result';
import type {
  DataSource,
  GeoVisGeometryType,
  LegendSpec,
  MapType,
  VisualizationSpec,
} from '../spec/types';
import type { GeoVisAction } from './action';

/** Current `ContextPacket` schema version (ADR-0004, versioned like the spec schema). */
export const CONTEXT_PACKET_SCHEMA_VERSION = 1;

export interface ContextPacketSource {
  id: string;
  type: DataSource['type'];
}

export interface ContextPacketLayer {
  id: string;
  geometry: GeoVisGeometryType;
  visible: boolean;
}

export interface ContextPacketLegend {
  id: string;
  scaleKind?: 'categorical' | 'threshold';
  /** `[min, max]` of the scale's break points — never the full break list (ADR-0004). */
  domain?: [number, number];
  unit?: string;
}

/**
 * Versioned, read-only, metadata-only summary of the current map (ADR-0004).
 * Contains aggregates only — never GeoJSON geometry, `mapData[].data` rows,
 * or full color/threshold lists. Every id here is one an action already
 * accepts (`layers[].id`, etc.) — what the packet names, an action can
 * target. Produced on demand by `GeoVisRuntime.getContextPacket()`; grows
 * one field per PRD-002 phase.
 */
export interface ContextPacket {
  schemaVersion: number;
  mapType?: MapType;
  sources: ContextPacketSource[];
  layers: ContextPacketLayer[];
  legends: ContextPacketLegend[];
  /** The ADR-0003 vocabulary, filtered to what the current spec actually supports. */
  allowedActions: GeoVisAction['type'][];
  /** Non-blocking issues from the last `resolved` result (e.g. policy violations). */
  warnings: GeoVisIssue[];
  /** The last `GeoVisResult` from `update`/`applyPatch`/`dispatch` (ADR-0001). */
  lastResult: GeoVisResult;
}

/** `[min, max]` of `thresholds`, or `undefined` when there are none — never the full list. */
const buildDomain = (
  thresholds: number[] | undefined
): [number, number] | undefined => {
  if (!thresholds || thresholds.length === 0) return undefined;
  return [Math.min(...thresholds), Math.max(...thresholds)];
};

const buildLegendSummary = (legend: LegendSpec): ContextPacketLegend => {
  const { colorBy } = legend;
  if (!colorBy) return { id: legend.id };
  if (colorBy.type === 'categorical') {
    return { id: legend.id, scaleKind: 'categorical' };
  }
  const unit =
    legend.labelFormat?.type === 'range' ? legend.labelFormat.unit : undefined;
  return {
    id: legend.id,
    scaleKind: 'threshold',
    domain: buildDomain(colorBy.thresholds),
    unit,
  };
};

/** The ADR-0003 vocabulary filtered to what `spec` currently supports. */
const computeAllowedActions = (
  spec: VisualizationSpec
): GeoVisAction['type'][] => {
  const actions: GeoVisAction['type'][] = [];
  if (spec.layers.length > 0) actions.push('toggle-layer');
  return actions;
};

/**
 * Derives the current `ContextPacket` from `spec` and the last `GeoVisResult`.
 * Cheap enough to call on every turn (ADR-0004 consequence) — no geometry or
 * data-row traversal, only the spec's own metadata arrays.
 */
export const buildContextPacket = (
  spec: VisualizationSpec,
  result: GeoVisResult
): ContextPacket => {
  return {
    schemaVersion: CONTEXT_PACKET_SCHEMA_VERSION,
    mapType: spec.mapType,
    sources: spec.sources.map((s) => {
      return { id: s.id, type: s.type };
    }),
    layers: spec.layers.map((l) => {
      return { id: l.id, geometry: l.geometry, visible: l.visible !== false };
    }),
    legends: (spec.legends ?? []).map(buildLegendSummary),
    allowedActions: computeAllowedActions(spec),
    warnings: result.status === 'resolved' ? result.warnings : [],
    lastResult: result,
  };
};
