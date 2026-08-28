import { Flex } from '@ttoss/ui';

import type { GeovisWorkspaceSidebarFilterBlock } from '../../context/GeovisWorkspaceContext';
import { ChipsControl } from './ChipsControl';
import { CollapsibleSection } from './CollapsibleSection';
import { LocatorControl } from './LocatorControl';
import { TimelineControl } from './TimelineControl';

/**
 * The "Filtros" tab: a stack of collapsible blocks (timeline, chips, locator).
 * Timeline value and play/pause are lifted; the chips selection is lifted so
 * the tab-bar badge can count it.
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
  value: number;
  onValueChange: (next: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  intervalSeconds: number;
  onIntervalChange: (next: number) => void;
  chipSelected: string[];
  onChipToggle: (id: string) => void;
  onChipClear: () => void;
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
        const { control } = block;

        return (
          <CollapsibleSection
            key={block.id}
            title={block.title}
            icon={block.icon}
            defaultOpen={block.defaultOpen ?? true}
          >
            {control.kind === 'timeline' ? (
              <TimelineControl
                control={control}
                value={value}
                onChange={onValueChange}
                playing={playing}
                onTogglePlay={onTogglePlay}
                intervalSeconds={intervalSeconds}
                onIntervalChange={onIntervalChange}
              />
            ) : control.kind === 'chips' ? (
              <ChipsControl
                control={control}
                selected={chipSelected}
                onToggle={onChipToggle}
                onClear={onChipClear}
              />
            ) : (
              <LocatorControl control={control} />
            )}
          </CollapsibleSection>
        );
      })}
    </Flex>
  );
};
