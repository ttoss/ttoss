import type { GeoVisIssue } from './result';
import type { MapData, VisualizationLayer, VisualizationSpec } from './types';

/**
 * The height dataset must not share the colour dataset's `stateKey`: both
 * write the same features' state, so one would overwrite the other.
 */
const validateHeightStateKey = ({
  layer,
  height,
  mapData,
}: {
  layer: VisualizationLayer;
  height: MapData;
  mapData: MapData[];
}): GeoVisIssue[] => {
  const color = mapData.find((entry) => {
    return entry.mapDataId === layer.mapDataId;
  });
  const key = height.stateKey ?? 'value';
  const collides =
    color !== undefined &&
    color.mapDataId !== height.mapDataId &&
    (color.stateKey ?? 'value') === key;
  if (!collides) return [];

  return [
    {
      code: 'state-key-collision',
      subject: {
        path: `mapData[${height.mapDataId}].stateKey`,
        id: height.mapDataId,
      },
      message: `layer '${layer.id}' reads its colour from mapData '${color.mapDataId}' and its height from '${height.mapDataId}', which share stateKey '${key}': both write the same feature-state, so one overwrites the other — give the height dataset a stateKey of its own`,
    },
  ];
};

/** The checks one extruded layer's own height dataset has to pass. */
const validateLayerHeightData = ({
  layer,
  mapData,
}: {
  layer: VisualizationLayer;
  mapData: MapData[];
}): GeoVisIssue[] => {
  const heightId = layer.extrusion?.mapDataId;
  if (!heightId) return [];
  const path = `layers[${layer.id}].extrusion.mapDataId`;
  const height = mapData.find((entry) => {
    return entry.mapDataId === heightId;
  });

  if (!height) {
    return [
      {
        code: 'unknown-map-data-id',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' extrusion references unknown mapDataId '${heightId}'`,
        repair: [
          {
            kind: 'allowed-values',
            path,
            values: mapData.map((entry) => {
              return entry.mapDataId;
            }),
          },
        ],
      },
    ];
  }

  if (height.mapId !== layer.sourceId) {
    return [
      {
        code: 'source-scope-conflict',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' extrusion mapDataId '${heightId}' points to source '${height.mapId}' but layer uses source '${layer.sourceId}'; feature-state is source-scoped so this dataset can never lift this layer`,
      },
    ];
  }

  return validateHeightStateKey({ layer, height, mapData });
};

/**
 * Validates the height datasets extruded layers declare: the id must name a
 * `mapData` entry, that entry must sit on the layer's source (feature-state is
 * source-scoped), and it must not share the colour dataset's `stateKey` — two
 * datasets writing one key on the same features would overwrite each other.
 *
 * @param spec - The spec to check.
 * @returns One issue per failed check.
 */
export const validateExtrusionData = (
  spec: VisualizationSpec
): GeoVisIssue[] => {
  const mapData = spec.mapData ?? [];
  return spec.layers.flatMap((layer) => {
    return validateLayerHeightData({ layer, mapData });
  });
};
