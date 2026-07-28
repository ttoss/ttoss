import { useDismissGeoVisClick, useGeoVisClick } from '@ttoss/geovis';
import { useI18n } from '@ttoss/react-i18n';
import { Flex, IconButton, Text } from '@ttoss/ui';
import type * as React from 'react';

import { useFeatureDetail } from '../hooks/useFeatureDetail';
import { useGeovisWorkspace } from '../hooks/useGeovisWorkspace';
import { messages } from '../messages';

/**
 * Default content of the `inspector` slot: the last clicked feature's
 * `layerId` and `value`, with a dismiss button. `dismiss` comes from
 * `useDismissGeoVisClick()` — the same reset Escape/outside-click already
 * trigger — so all three dismiss paths clear the map's selection highlight
 * and this panel simultaneously (ADR-0003, D5). Renders nothing (not an
 * empty box) when nothing is selected.
 */
export const InspectorPanel = () => {
  const click = useGeoVisClick();
  const dismiss = useDismissGeoVisClick();
  const {
    intl: { formatMessage },
  } = useI18n();

  if (!click) return null;

  return (
    <Flex sx={{ flexDirection: 'column', gap: '2' }}>
      <Flex sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          sx={{
            fontSize: 'xs',
            fontWeight: 'semibold',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6b7280',
          }}
        >
          {click.layerId}
        </Text>

        <IconButton
          icon="lucide:x"
          aria-label={formatMessage(messages.dismissInspector)}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            // Release focus before the button's panel unmounts, so a focused
            // element is never left dangling in the accessibility tree.
            event.currentTarget.blur();
            dismiss();
          }}
          sx={{
            color: '#6b7280',
            backgroundColor: 'transparent',
            borderRadius: 'md',
            '&:hover': {
              color: '#4338ca',
            },
          }}
        />
      </Flex>

      <Text sx={{ fontSize: 'sm', color: '#374151' }}>
        {click.value ?? formatMessage(messages.inspectorNoValue)}
      </Text>

      <Text
        as="code"
        sx={{
          fontFamily: 'monospace',
          fontSize: 'xs',
          color: 'display.text.secondary.default',
        }}
      >
        {String(click.featureId)}
      </Text>
    </Flex>
  );
};

/**
 * `inspector` slot content for the imperative detail API: renders
 * `rightSidebar.renderDetails` from the current fetch state (see
 * {@link useFeatureDetail}). Calling the hook also opens the sidebar and runs
 * `onFeatureSelect` on accepted clicks, so it stays mounted even while it has
 * nothing to render yet. Renders nothing until an accepted click produces state.
 */
export const DetailPanel = () => {
  const { config } = useGeovisWorkspace();
  const detail = useFeatureDetail();

  const renderDetails = config.rightSidebar?.renderDetails;
  if (!renderDetails || !detail) return null;

  return <>{renderDetails(detail)}</>;
};

/**
 * Default `inspector` slot component: the imperative {@link DetailPanel} when
 * the right sidebar configures `onFeatureSelect`/`renderDetails`, otherwise the
 * built-in {@link InspectorPanel}.
 */
export const InspectorSlot = () => {
  const { config } = useGeovisWorkspace();
  const rightSidebar = config.rightSidebar;

  return rightSidebar?.onFeatureSelect || rightSidebar?.renderDetails ? (
    <DetailPanel />
  ) : (
    <InspectorPanel />
  );
};
