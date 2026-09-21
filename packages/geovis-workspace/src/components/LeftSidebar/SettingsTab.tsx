import { Box, Flex, Text } from '@ttoss/ui';

import type {
  GeovisWorkspaceSidebarSettingsBlock,
  GeovisWorkspaceSidebarSettingsControl,
} from '../../context/GeovisWorkspaceContext';
import { ColorRampSettingControl } from './ColorRampSettingControl';
import { FilterBlockSection } from './FilterBlockSection';
import { SliderSettingControl } from './SliderSettingControl';
import { COLOR } from './theme';
import { ToggleSettingControl } from './ToggleSettingControl';

/**
 * Renders one block's control.
 *
 * Every kind but the last is matched by name, so the final `control` is
 * narrowed to the toggle by exhaustion: adding a kind to
 * {@link GeovisWorkspaceSidebarSettingsControl} turns that last line into a
 * type error instead of silently routing the new kind into the toggle.
 */
const BlockControl = ({
  control,
  label,
}: {
  control: GeovisWorkspaceSidebarSettingsControl;
  label: string;
}) => {
  if (control.kind === 'slider') {
    return <SliderSettingControl control={control} />;
  }

  if (control.kind === 'colorRamp') {
    return <ColorRampSettingControl control={control} label={label} />;
  }

  return <ToggleSettingControl control={control} label={label} />;
};

/** The explanatory line between a block's header and its control. */
const BlockHint = ({ hint }: { hint: string }) => {
  return (
    <Text
      sx={{
        marginTop: '8px',
        fontSize: '11px',
        lineHeight: 1.5,
        color: COLOR.textMuted,
      }}
    >
      {hint}
    </Text>
  );
};

/**
 * The "Settings" tab: a stack of headed blocks changing how the active
 * variation is drawn.
 *
 * A toggle block skips the header band: the switch row already carries the
 * block's title, and a header above it would say the same words twice. Every
 * control holds its own state — the tab is presentational for now, so nothing
 * is lifted.
 *
 * @param params.blocks - The blocks, top to bottom.
 * @returns The tab body.
 *
 * @example
 * <SettingsTab blocks={[{ id: 'opacity', title: 'Opacity', control: opacityControl }]} />
 */
export const SettingsTab = ({
  blocks,
}: {
  blocks: GeovisWorkspaceSidebarSettingsBlock[];
}) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '28px',
        paddingX: '16px',
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
    >
      {blocks.map((block) => {
        if (block.control.kind === 'toggle') {
          return (
            <Box key={block.id}>
              <BlockControl control={block.control} label={block.title} />
              {block.hint ? <BlockHint hint={block.hint} /> : null}
            </Box>
          );
        }

        return (
          <FilterBlockSection
            key={block.id}
            title={block.title}
            icon={block.icon}
            collapsible={block.collapsible}
            defaultOpen={block.defaultOpen}
          >
            <BlockControl control={block.control} label={block.title} />
            {block.hint ? <BlockHint hint={block.hint} /> : null}
          </FilterBlockSection>
        );
      })}
    </Flex>
  );
};
