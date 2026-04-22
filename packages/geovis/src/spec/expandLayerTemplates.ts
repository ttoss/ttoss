import type {
  CategoricalColorBy,
  CategoricalColorByTemplate,
  ColorBy,
  ColorByTemplate,
  LayerTemplate,
  QuantitativeColorBy,
  QuantitativeColorByTemplate,
  VisualizationLayer,
  VisualizationSpec,
  VisualizationView,
} from './types';

const resolveLabel = (spec: VisualizationSpec, property: string): string => {
  const labels = (
    spec.metadata as
      | { displayPropertyLabels?: Record<string, string> }
      | undefined
  )?.displayPropertyLabels;
  return labels?.[property] ?? property;
};

const buildDisplayPropertyLabels = (
  spec: VisualizationSpec,
  properties: string[]
): Record<string, string> => {
  return Object.fromEntries(
    properties.map((property) => {
      return [property, resolveLabel(spec, property)];
    })
  );
};

const interpolate = (
  pattern: string,
  values: Record<string, string>
): string => {
  return pattern.replace(/\$\{(\w+)\}/g, (_, key: string) => {
    return values[key] ?? '';
  });
};

const injectColorByProperty = (
  template: ColorByTemplate,
  property: string
): ColorBy => {
  if (template.type === 'categorical') {
    const t = template as CategoricalColorByTemplate;
    const colorBy: CategoricalColorBy = { type: 'categorical', property };
    if (t.palette !== undefined) colorBy.palette = t.palette;
    if (t.colors !== undefined) colorBy.colors = t.colors;
    if (t.mapping !== undefined) colorBy.mapping = t.mapping;
    if (t.defaultColor !== undefined) colorBy.defaultColor = t.defaultColor;
    return colorBy;
  }

  const t = template as QuantitativeColorByTemplate;
  const colorBy: QuantitativeColorBy = {
    type: 'quantitative',
    property,
    scale: t.scale,
  };
  if (t.bins !== undefined) colorBy.bins = t.bins;
  if (t.thresholds !== undefined) colorBy.thresholds = t.thresholds;
  if (t.palette !== undefined) colorBy.palette = t.palette;
  if (t.colors !== undefined) colorBy.colors = t.colors;
  if (t.defaultColor !== undefined) colorBy.defaultColor = t.defaultColor;
  return colorBy;
};

const expandTemplate = (
  template: LayerTemplate,
  spec: VisualizationSpec,
  templateIndex: number
): { layers: VisualizationLayer[]; views: VisualizationView[] } => {
  const templateId = template.id ?? `template${templateIndex}`;
  const dataId = template.dataId ?? spec.data[0]?.id;
  if (!dataId) {
    return { layers: [], views: [] };
  }
  const colorByTemplate: ColorByTemplate = template.colorBy ?? {
    type: 'categorical',
  };
  const hasExplicitId = template.id !== undefined;
  const defaultLayerIdPattern = hasExplicitId
    ? '${templateId}-${property}'
    : '${property}';
  const layerIdPattern = template.layerIdPattern ?? defaultLayerIdPattern;
  const viewIdPattern = template.viewIdPattern ?? layerIdPattern;
  const labelPattern = template.labelPattern ?? '${label}';
  const shouldGenerateViews = template.generateViews ?? true;

  const layers: VisualizationLayer[] = [];
  const views: VisualizationView[] = [];

  for (const property of template.properties) {
    const label = resolveLabel(spec, property);
    const values = {
      templateId,
      property,
      label,
    };

    const layerId = interpolate(layerIdPattern, values);
    const resolvedLabel = interpolate(labelPattern, values);

    const layer: VisualizationLayer = {
      id: layerId,
      dataId,
      geometry: template.geometry,
      title: resolvedLabel,
      labelProperty: template.labelProperty,
      displayProperties: template.displayProperties,
      displayPropertyLabels: buildDisplayPropertyLabels(
        spec,
        template.displayProperties ?? []
      ),
      colorBy: injectColorByProperty(colorByTemplate, property),
    };

    if (template.sourceLayer !== undefined) {
      layer.sourceLayer = template.sourceLayer;
    }
    if (template.visible !== undefined) {
      layer.visible = template.visible;
    }
    if (template.minzoom !== undefined) {
      layer.minzoom = template.minzoom;
    }
    if (template.maxzoom !== undefined) {
      layer.maxzoom = template.maxzoom;
    }
    if (template.paint !== undefined) {
      layer.paint = template.paint;
    }

    layers.push(layer);

    if (shouldGenerateViews) {
      views.push({
        id: interpolate(viewIdPattern, values),
        label: resolvedLabel,
        layers: [layerId],
      });
    }
  }

  return { layers, views };
};

/**
 * Materializes every entry of `spec.layerTemplates` into concrete `layers`
 * (and optionally `views`). Returns a new spec with `layerTemplates`
 * removed and the generated entries appended to the existing arrays. The
 * input spec is not mutated.
 */
export const expandLayerTemplates = (
  spec: VisualizationSpec
): VisualizationSpec => {
  if (!spec.layerTemplates || spec.layerTemplates.length === 0) {
    return spec;
  }

  const next: VisualizationSpec = {
    ...spec,
    layers: [...spec.layers],
    views: spec.views ? [...spec.views] : undefined,
  };

  let index = 0;
  for (const template of spec.layerTemplates) {
    const { layers, views } = expandTemplate(template, spec, index);
    next.layers.push(...layers);
    if (views.length > 0) {
      next.views = [...(next.views ?? []), ...views];
    }
    index += 1;
  }

  delete next.layerTemplates;
  return next;
};
