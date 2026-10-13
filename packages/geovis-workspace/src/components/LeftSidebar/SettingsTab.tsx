import { Box, Flex, Text } from '@ttoss/ui';

import type {
  GeovisWorkspaceSidebarSettingsBlock,
  GeovisWorkspaceSidebarSettingsControl,
  GeovisWorkspaceSidebarSettingsSubBlock,
} from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { BearingSettingControl } from './BearingSettingControl';
import { ChoiceSettingControl } from './ChoiceSettingControl';
import { ColorRampSettingControl } from './ColorRampSettingControl';
import { FilterBlockSection } from './FilterBlockSection';
import { SliderSettingControl } from './SliderSettingControl';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';
import { ToggleSettingControl } from './ToggleSettingControl';
import { useControlReadout } from './useControlReadout';
import { isGateOpen, useSidebarSections } from './useSections';

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
  readoutInHeading,
}: {
  control: GeovisWorkspaceSidebarSettingsControl;
  label: string;
  /** Set under a sub-block, whose heading shows the readout instead. */
  readoutInHeading?: boolean;
}) => {
  if (control.kind === 'slider') {
    return (
      <SliderSettingControl
        control={control}
        readoutInHeading={readoutInHeading}
      />
    );
  }

  if (control.kind === 'colorRamp') {
    return <ColorRampSettingControl control={control} label={label} />;
  }

  if (control.kind === 'choice') {
    return <ChoiceSettingControl control={control} label={label} />;
  }

  if (control.kind === 'bearing') {
    return (
      <BearingSettingControl
        control={control}
        readoutInHeading={readoutInHeading}
      />
    );
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
 * A sub-block's heading: the lighter title — 10px, regular weight, no icon —
 * with the control's readout on the right.
 */
const SubBlockHeading = ({
  title,
  control,
}: {
  title: string;
  control: GeovisWorkspaceSidebarSettingsControl;
}) => {
  const readout = useControlReadout(control);

  return (
    <Flex
      sx={{
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '8px',
      }}
    >
      <Text
        sx={{
          fontFamily: FONT_HEAD,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLOR.textFaint,
        }}
      >
        {title}
      </Text>

      {readout ? (
        <Text
          sx={{
            flexShrink: 0,
            fontFamily: FONT_MONO,
            fontSize: readout.tone === 'unit' ? '10px' : '11px',
            color: readout.tone === 'unit' ? COLOR.textFaint : COLOR.textStrong,
          }}
        >
          {readout.text}
        </Text>
      ) : null}
    </Flex>
  );
};

/**
 * The sub-blocks under a block's control, those whose gate is open. A toggle
 * skips the heading, as it does in a block: its row already carries the title.
 */
const SubBlocks = ({
  subBlocks,
}: {
  subBlocks: GeovisWorkspaceSidebarSettingsSubBlock[];
}) => {
  const { selection } = useGeovisWorkspace();
  const sections = useSidebarSections();
  const shown = subBlocks.filter((subBlock) => {
    return isGateOpen({ gate: subBlock.shownWhen, sections, selection });
  });

  if (shown.length === 0) {
    return null;
  }

  return (
    <Flex sx={{ flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
      {shown.map((subBlock) => {
        return (
          <Box key={subBlock.id}>
            {subBlock.control.kind === 'toggle' ? null : (
              <SubBlockHeading
                title={subBlock.title}
                control={subBlock.control}
              />
            )}
            <BlockControl
              control={subBlock.control}
              label={subBlock.title}
              readoutInHeading
            />
            {subBlock.hint ? <BlockHint hint={subBlock.hint} /> : null}
          </Box>
        );
      })}
    </Flex>
  );
};

/**
 * The "Settings" tab: a stack of headed blocks changing how the active
 * variation is drawn.
 *
 * A toggle block skips the header band: the switch row already carries the
 * block's title, and a header above it would say the same words twice. Every
 * control holds its own state — the tab is presentational for now, so nothing
 * is lifted. A block whose `shownWhen` gate is closed is not rendered at all;
 * its value stays in the shared selection, so it returns as it was left.
 * A block's `subBlocks` follow its control, under lighter headings, each
 * gated the same way.
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
  const { selection } = useGeovisWorkspace();
  const sections = useSidebarSections();
  const shown = blocks.filter((block) => {
    return isGateOpen({ gate: block.shownWhen, sections, selection });
  });

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
      {shown.map((block) => {
        if (block.control.kind === 'toggle') {
          return (
            <Box key={block.id}>
              <BlockControl control={block.control} label={block.title} />
              {block.hint ? <BlockHint hint={block.hint} /> : null}
              {block.subBlocks ? (
                <SubBlocks subBlocks={block.subBlocks} />
              ) : null}
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
            {block.subBlocks ? <SubBlocks subBlocks={block.subBlocks} /> : null}
          </FilterBlockSection>
        );
      })}
    </Flex>
  );
};
