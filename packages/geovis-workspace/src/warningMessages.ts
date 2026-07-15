import { type GeoVisIssueCode } from '@ttoss/geovis';
import { defineMessages, type MessageDescriptor } from '@ttoss/react-i18n';

/**
 * One catalog entry per `GeoVisIssueCode` (ADR-0003), plus a closed
 * `fallback` key used when a future code has no entry here yet — the
 * forward-compatibility obligation the ADR names.
 */
export const warningMessages = defineMessages({
  'invalid-schema': {
    defaultMessage:
      'The visualization spec does not match the expected schema.',
    description: 'Warnings panel: spec fails JSON schema validation.',
  },
  'invalid-schema-version': {
    defaultMessage:
      'The visualization spec targets an unsupported schema version.',
    description: 'Warnings panel: spec.schemaVersion is not supported.',
  },
  'invalid-threshold-order': {
    defaultMessage: 'Legend thresholds must be in ascending order.',
    description: 'Warnings panel: colorBy.thresholds are not sorted.',
  },
  'invalid-threshold-value': {
    defaultMessage: 'A legend threshold value is invalid.',
    description:
      'Warnings panel: a colorBy.thresholds entry is not a finite number.',
  },
  'invalid-size-range': {
    defaultMessage: 'The size range for proportional circles is invalid.',
    description: 'Warnings panel: sizeBy.range is malformed.',
  },
  'invalid-size-mode': {
    defaultMessage: 'The size mode configuration is invalid.',
    description: 'Warnings panel: sizeBy.mode is malformed.',
  },
  'duplicate-map-data-id': {
    defaultMessage: 'Two map data entries share the same id.',
    description: 'Warnings panel: mapData ids collide.',
  },
  'unknown-map-data-id': {
    defaultMessage: 'A layer references a map data id that does not exist.',
    description:
      'Warnings panel: layer.mapDataId has no matching mapData entry.',
  },
  'unknown-source': {
    defaultMessage: 'A layer references a source that does not exist.',
    description: 'Warnings panel: layer.sourceId has no matching source.',
  },
  'source-scope-conflict': {
    defaultMessage: 'Two sources conflict with each other.',
    description: 'Warnings panel: two sources declare overlapping scope.',
  },
  'duplicate-dimension': {
    defaultMessage:
      'Two map data entries declare the same dimension for the same source.',
    description: 'Warnings panel: mapData color/size dimension collides.',
  },
  'state-key-collision': {
    defaultMessage:
      'Two map data entries collide on the same feature-state key.',
    description:
      'Warnings panel: resolved stateKey collides across mapData entries.',
  },
  'unsupported-source-type': {
    defaultMessage: 'This source type is not supported.',
    description:
      'Warnings panel: source.type is not implemented by the engine adapter.',
  },
  'unsupported-layer-type': {
    defaultMessage: 'This layer type is not supported.',
    description:
      'Warnings panel: layer.geometry is not implemented by the engine adapter.',
  },
  'unsupported-data-feature': {
    defaultMessage: 'This data feature is not supported.',
    description:
      'Warnings panel: a data-level feature is not implemented by the engine adapter.',
  },
  'unsupported-view-feature': {
    defaultMessage: 'This view feature is not supported.',
    description:
      'Warnings panel: a view-level feature is not implemented by the engine adapter.',
  },
  'unsupported-engine': {
    defaultMessage: 'This map engine is not supported.',
    description: 'Warnings panel: spec.engine has no matching adapter.',
  },
  'unsupported-patch-target': {
    defaultMessage: 'This field cannot be updated without a full spec update.',
    description:
      'Warnings panel: an applyPatch call targeted a field outside SpecPatchTarget.',
  },
  'policy-violation': {
    defaultMessage: 'This map violates the cartography policy.',
    description: 'Warnings panel: spec.metadata flags a policy violation.',
  },
  fallback: {
    defaultMessage: '{message}',
    description:
      'Warnings panel: untranslated issue message, used for a code with no catalog entry yet.',
  },
});

/**
 * Looks up a code's catalog entry without TypeScript treating the current
 * `GeoVisIssueCode` union as proof of completeness — a compiled workspace can
 * run against a newer `@ttoss/geovis` whose codes this catalog does not know
 * about yet, so the lookup must stay genuinely optional at runtime.
 */
export const getWarningMessage = (
  code: GeoVisIssueCode
): MessageDescriptor | undefined => {
  return (warningMessages as Record<string, MessageDescriptor>)[code];
};
