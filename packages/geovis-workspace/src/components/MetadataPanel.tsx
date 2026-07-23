import { useGeoVis } from '@ttoss/geovis';
import { useI18n } from '@ttoss/react-i18n';
import { Flex, Text } from '@ttoss/ui';

import { messages } from '../messages';

/**
 * Default content of the `metadata` slot: spec-level annotations —
 * `mapType`, when set, and the source count. Opt-in by construction: renders
 * nothing when the spec has neither (see `hasMetadataDefaultContent` in
 * `slots.ts`), so it never shows as an always-on placeholder.
 */
export const MetadataPanel = () => {
  const { spec } = useGeoVis();
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Flex sx={{ flexDirection: 'column', gap: '1' }}>
      {spec.mapType && (
        <Text sx={{ fontSize: 'sm', color: '#374151' }}>
          {formatMessage(messages.metadataMapType, {
            map_type: spec.mapType,
          })}
        </Text>
      )}

      {spec.sources.length > 0 && (
        <Text sx={{ fontSize: 'sm', color: '#374151' }}>
          {formatMessage(messages.metadataSourceCount, {
            count: spec.sources.length,
          })}
        </Text>
      )}
    </Flex>
  );
};
