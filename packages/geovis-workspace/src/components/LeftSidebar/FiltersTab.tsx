import { Flex } from '@ttoss/ui';

import type {
  GeovisWorkspaceSidebarFilterBlock,
  GeovisWorkspaceSidebarFilterControl,
} from '../../context/GeovisWorkspaceContext';
import { ChipsControl } from './ChipsControl';
import { CollapsibleSection } from './CollapsibleSection';
import { LocatorControl } from './LocatorControl';
import { TimelineControl } from './TimelineControl';
import { VariationsControl } from './VariationsControl';

/** The lifted state a block's control may need, passed straight through. */
type LiftedState = {
  value: number;
  onValueChange: (next: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  intervalSeconds: number;
  onIntervalChange: (next: number) => void;
  chipSelected: string[];
  onChipToggle: (id: string) => void;
  onChipClear: () => void;
};

/**
 * Renders one block's control.
 *
 * Each kind is matched by name and the locator is left to exhaustion, so the
 * final `control` is narrowed to it: adding a kind to
 * {@link GeovisWorkspaceSidebarFilterControl} turns that last line into a type
 * error instead of silently routing the new kind into the locator.
 *
 * @param params.control - The block's control.
 * @param params.lifted - State owned above the tab (timeline, chips).
 * @returns The control's element.
 *
 * @example
 * <BlockControl control={{ kind: 'locator', options: [] }} lifted={lifted} />
 */
const BlockControl = ({
  control,
  lifted,
}: {
  control: GeovisWorkspaceSidebarFilterControl;
  lifted: LiftedState;
}) => {
  if (control.kind === 'timeline') {
    return (
      <TimelineControl
        control={control}
        value={lifted.value}
        onChange={lifted.onValueChange}
        playing={lifted.playing}
        onTogglePlay={lifted.onTogglePlay}
        intervalSeconds={lifted.intervalSeconds}
        onIntervalChange={lifted.onIntervalChange}
      />
    );
  }

  if (control.kind === 'chips') {
    return (
      <ChipsControl
        control={control}
        selected={lifted.chipSelected}
        onToggle={lifted.onChipToggle}
        onClear={lifted.onChipClear}
      />
    );
  }

  if (control.kind === 'variations') {
    return <VariationsControl control={control} />;
  }

  return <LocatorControl control={control} />;
};

/**
 * The "Filtros" tab: a stack of collapsible blocks (timeline, chips, locator,
 * variations). Timeline value and play/pause are lifted; the chips selection is
 * lifted so the tab-bar badge can count it. A variations block reads the shared
 * selection directly, so several of them can share one tab.
 */
export const FiltersTab = ({
  blocks,
  value,
  onValueChange,
  playing,
  onTogglePlay,
  intervalSeconds,
  onIntervalChange,
  chipSelected,
  onChipToggle,
  onChipClear,
}: {
  blocks: GeovisWorkspaceSidebarFilterBlock[];
} & LiftedState) => {
  const lifted: LiftedState = {
    value,
    onValueChange,
    playing,
    onTogglePlay,
    intervalSeconds,
    onIntervalChange,
    chipSelected,
    onChipToggle,
    onChipClear,
  };

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
        return (
          <CollapsibleSection
            key={block.id}
            title={block.title}
            icon={block.icon}
            defaultOpen={block.defaultOpen ?? true}
          >
            <BlockControl control={block.control} lifted={lifted} />
          </CollapsibleSection>
        );
      })}
    </Flex>
  );
};
