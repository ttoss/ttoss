import type { GeoVisIssue, GeoVisResult } from '../spec/result';
import type {
  DataSource,
  GeoVisGeometryType,
  LayerFilter,
  LegendSpec,
  MapType,
  VisualizationSpec,
} from '../spec/types';
import type { GeoVisAction, GeoVisSelection } from './action';
import type { CapabilitySet } from './adapter';

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
  /** Id of the bound `MapData` entry, if any — matches `set-map-data`'s `mapDataId`. */
  mapDataId?: string;
  /** The bound `MapData` entry's own `dimension`, when declared. */
  dimension?: 'color' | 'size';
  /** The layer's current filter predicate, if any — matches `set-filter`'s `filter`. */
  filter?: LayerFilter;
}

export interface ContextPacketLegend {
  id: string;
  scaleKind?: 'categorical' | 'threshold';
  /** `[min, max]` of the scale's break points — never the full break list (ADR-0004). */
  domain?: [number, number];
  unit?: string;
}

/** A declared `ViewPreset`'s id/label — never its raw `view` camera values (ADR-0004). */
export interface ContextPacketViewPreset {
  id: string;
  label?: string;
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
  /** Declared `viewPresets`, id/label only — never raw camera coordinates (ADR-0004). */
  viewPresets: ContextPacketViewPreset[];
  /** The runtime's current selection, or `null` when nothing is selected. */
  selection: GeoVisSelection | null;
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

/** The ADR-0003 vocabulary filtered to what `spec` and the active adapter currently support. */
const computeAllowedActions = (
  spec: VisualizationSpec,
  capabilities: CapabilitySet
): GeoVisAction['type'][] => {
  const actions: GeoVisAction['type'][] = [];
  if (spec.layers.length > 0) {
    actions.push('toggle-layer', 'select-feature');
  }
  if (spec.layers.length > 0 && (spec.mapData?.length ?? 0) > 0) {
    actions.push('set-map-data');
  }
  const sourceTypeById = new Map(
    spec.sources.map((s) => {
      return [s.id, s.type] as const;
    })
  );
  const canFilter = spec.layers.some((l) => {
    const sourceType = sourceTypeById.get(l.sourceId);
    return sourceType && capabilities.dataFeatures.filter.includes(sourceType);
  });
  if (canFilter) actions.push('set-filter');
  if ((spec.viewPresets?.length ?? 0) > 0) actions.push('set-view-preset');
  return actions;
};

/** Resolves the `dimension` of the `MapData` entry a layer is bound to, if any. */
const resolveLayerDimension = (
  spec: VisualizationSpec,
  layer: VisualizationSpec['layers'][number]
): 'color' | 'size' | undefined => {
  if (!layer.mapDataId) return undefined;
  return spec.mapData?.find((md) => {
    return md.mapDataId === layer.mapDataId;
  })?.dimension;
};

/**
 * Derives the current `ContextPacket` from `spec`, the last `GeoVisResult`,
 * and the runtime's current selection. Cheap enough to call on every turn
 * (ADR-0004 consequence) — no geometry or data-row traversal, only the
 * spec's own metadata arrays.
 */
export const buildContextPacket = (
  spec: VisualizationSpec,
  result: GeoVisResult,
  selection: GeoVisSelection | null,
  capabilities: CapabilitySet
): ContextPacket => {
  return {
    schemaVersion: CONTEXT_PACKET_SCHEMA_VERSION,
    mapType: spec.mapType,
    sources: spec.sources.map((s) => {
      return { id: s.id, type: s.type };
    }),
    layers: spec.layers.map((l) => {
      return {
        id: l.id,
        geometry: l.geometry,
        visible: l.visible !== false,
        mapDataId: l.mapDataId,
        dimension: resolveLayerDimension(spec, l),
        filter: l.filter,
      };
    }),
    legends: (spec.legends ?? []).map(buildLegendSummary),
    viewPresets: (spec.viewPresets ?? []).map((p) => {
      return { id: p.id, label: p.label };
    }),
    selection,
    allowedActions: computeAllowedActions(spec, capabilities),
    warnings: result.status === 'resolved' ? result.warnings : [],
    lastResult: result,
  };
};
