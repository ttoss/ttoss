import { useGeoVis } from '@ttoss/geovis';
import { useI18n } from '@ttoss/react-i18n';
import { Box, Checkbox, Flex, Text } from '@ttoss/ui';

import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';

/**
 * Opt-in `controls` slot variant: one row per layer with a visibility
 * checkbox and its legend id, reading `spec.layers` instead of
 * `config.controls.menus`. Enable it via
 * `config.slots.controls = { component: LayerListControls }`.
 *
 * Toggling a checkbox calls `onLayerVisibilityChange` — delegated to the
 * application, the same way `onRepair`/`onVariableChange` already are, since
 * only the application can rebuild `visualizationSpec` with the layer's new
 * `visible` value (`SpecPatch`'s `'layer'` target only supports `paint`
 * properties, not arbitrary layer fields).
 */
export const LayerListControls = () => {
  const { spec } = useGeoVis();
  const { onLayerVisibilityChange } = useGeovisWorkspace();
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Flex
      as="ul"
      sx={{
        flexDirection: 'column',
        gap: '2',
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      {spec.layers.map((layer) => {
        const isVisible = layer.visible !== false;

        return (
          <Box
            as="li"
            key={layer.id}
            sx={{ display: 'flex', alignItems: 'center', gap: '2' }}
          >
            <Checkbox
              checked={isVisible}
              aria-label={formatMessage(messages.layerVisibilityToggle, {
                layer_id: layer.id,
              })}
              onChange={() => {
                onLayerVisibilityChange?.(layer.id, !isVisible);
              }}
            />

            <Text sx={{ fontSize: 'sm', color: '#374151' }}>
              {layer.title ?? layer.id}
            </Text>

            {layer.activeLegendId && (
              <Text sx={{ fontSize: 'xs', color: '#6b7280' }}>
                {layer.activeLegendId}
              </Text>
            )}
          </Box>
        );
      })}
    </Flex>
  );
};
