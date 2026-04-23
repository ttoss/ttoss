import Ajv2020 from 'ajv/dist/2020';

import { applyDefaults } from './applyDefaults';
import schema from './schema.json';
import type {
  ColorBy,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONObject,
  GeoVisDataEntry,
  VisualizationSpec,
} from './types';

export type ValidationResult =
  | { valid: true; spec: VisualizationSpec }
  | { valid: false; errors: string[] };

const ajv = new Ajv2020({ strict: false });
const _validate = ajv.compile(schema);

const collectColorByProperties = (colorBy: ColorBy | undefined): string[] => {
  if (!colorBy) {
    return [];
  }

  return [colorBy.property];
};

const collectFeatureProperties = (feature: GeoJSONFeature): string[] => {
  if (!feature.properties) {
    return [];
  }

  return Object.keys(feature.properties);
};

const deriveFromGeoJSONObject = (
  data: GeoJSONObject
): Set<string> | undefined => {
  if (data.type === 'FeatureCollection') {
    const fc = data as GeoJSONFeatureCollection;
    const names = new Set<string>();
    for (const feature of fc.features) {
      for (const name of collectFeatureProperties(feature)) {
        names.add(name);
      }
    }
    return names;
  }

  if (data.type === 'Feature') {
    return new Set(collectFeatureProperties(data as GeoJSONFeature));
  }

  return undefined;
};

/**
 * Returns the set of property names present across the inline GeoJSON data
 * of a data entry, or `undefined` when the properties cannot be determined
 * statically (e.g. URL-based GeoJSON, vector tiles, native).
 */
const deriveEntryProperties = (
  entry: GeoVisDataEntry
): Set<string> | undefined => {
  if (entry.kind !== 'geojson-inline') {
    return undefined;
  }

  return deriveFromGeoJSONObject(entry.geojson);
};

const _validatePropertyReferences = (spec: VisualizationSpec): string[] => {
  const errors: string[] = [];

  const entryProps = new Map<string, Set<string> | undefined>();
  for (const entry of spec.data) {
    entryProps.set(entry.id, deriveEntryProperties(entry));
  }

  for (const [layerIndex, layer] of (spec.layers ?? []).entries()) {
    const allowed = entryProps.get(layer.dataId);

    // Cross-check is skipped when the entry's properties cannot be
    // determined statically (URL-based geojson, vector tiles, native, etc.).
    if (!allowed) {
      continue;
    }

    const checks: Array<{ path: string; property: string }> = [];

    if (layer.labelProperty) {
      checks.push({
        path: `/layers/${layerIndex}/labelProperty`,
        property: layer.labelProperty,
      });
    }

    if (layer.displayProperties)
      for (const [
        propertyIndex,
        property,
      ] of layer.displayProperties.entries()) {
        checks.push({
          path: `/layers/${layerIndex}/displayProperties/${propertyIndex}`,
          property,
        });
      }

    for (const property of collectColorByProperties(layer.colorBy)) {
      checks.push({
        path: `/layers/${layerIndex}/colorBy/property`,
        property,
      });
    }

    if (layer.legends)
      for (const [legendIndex, legend] of layer.legends.entries()) {
        for (const property of collectColorByProperties(legend.colorBy)) {
          checks.push({
            path: `/layers/${layerIndex}/legends/${legendIndex}/colorBy/property`,
            property,
          });
        }
      }

    for (const { path, property } of checks) {
      if (!allowed.has(property)) {
        errors.push(
          `${path} "${property}" is not present in any feature of data entry "${layer.dataId}"`
        );
      }
    }
  }

  if (spec.layerTemplates)
    for (const [templateIndex, template] of spec.layerTemplates.entries()) {
      const dataId = template.dataId ?? spec.data[0]?.id;
      if (!dataId) {
        continue;
      }
      const allowed = entryProps.get(dataId);
      if (!allowed) {
        continue;
      }

      const templateProperties = template.properties;
      const expansionProperties =
        templateProperties ?? template.displayProperties ?? [];
      const propPath = templateProperties ? 'properties' : 'displayProperties';

      for (const [propertyIndex, property] of expansionProperties.entries()) {
        if (!allowed.has(property)) {
          errors.push(
            `/layerTemplates/${templateIndex}/${propPath}/${propertyIndex} "${property}" is not present in any feature of data entry "${dataId}"`
          );
        }
      }
    }

  return errors;
};

export const validateSpec = (input: unknown): ValidationResult => {
  const valid = _validate(input);

  if (!valid) {
    const errors = (_validate.errors ?? []).map((e) => {
      return `${e.instancePath || '(root)'} ${e.message}`;
    });
    return { valid: false, errors };
  }

  // Run applyDefaults so that optional fields (layers, id, engine, view)
  // are populated before cross-checking property references.
  const spec = applyDefaults(input as Parameters<typeof applyDefaults>[0]);
  const crossCheckErrors = _validatePropertyReferences(spec);
  if (crossCheckErrors.length > 0) {
    return { valid: false, errors: crossCheckErrors };
  }

  return { valid: true, spec };
};
