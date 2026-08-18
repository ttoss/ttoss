import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, IconButton, Text } from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSidebarFilterBlock,
  GeovisWorkspaceSidebarPreview,
  GeovisWorkspaceSidebarSection,
  GeovisWorkspaceSidebarVariationsBody,
} from '../../context/GeovisWorkspaceContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { messages } from '../../messages';
import { FiltersTab } from './FiltersTab';
import { IconChip } from './IconChip';
import { SidebarTab } from './SidebarTab';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';
import { useChipSelection } from './useChipSelection';
import { useSections } from './useSections';
import { useTimeline } from './useTimeline';
import { VariationsTab } from './VariationsTab';

/** The header band: the active section's icon chip, title, and close button. */
const Header = ({
  section,
  onClose,
}: {
  section?: GeovisWorkspaceSidebarSection;
  onClose: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Flex
      sx={{
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingX: '20px',
        paddingY: '16px',
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      <Flex sx={{ alignItems: 'center', gap: '10px' }}>
        {section?.header.icon ? (
          <IconChip
            icon={section.header.icon}
            color={section.header.iconColor ?? COLOR.primary}
            background={section.header.iconBackground ?? COLOR.primaryTint}
            size={28}
            iconSize={14}
          />
        ) : null}

        {section ? (
          <Text
            sx={{
              fontFamily: FONT_HEAD,
              fontWeight: 600,
              fontSize: '15px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: COLOR.textStrong,
            }}
          >
            {section.header.title}
          </Text>
        ) : null}
      </Flex>

      <IconButton
        icon="lucide:x"
        aria-label={formatMessage(messages.closeMenu)}
        onClick={onClose}
        sx={{
          width: '28px',
          height: '28px',
          minWidth: 'auto',
          color: COLOR.textGhost,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          borderRadius: 'md',
          '&:hover': { color: COLOR.textMuted, backgroundColor: COLOR.fill },
        }}
      />
    </Flex>
  );
};

/** The icon tab bar: one tab per section, with a chip-count badge on filters. */
const TabBar = ({
  sections,
  activeId,
  chipCount,
  onSelect,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  activeId?: string;
  chipCount: number;
  onSelect: (id: string) => void;
}) => {
  return (
    <Flex
      sx={{
        flexShrink: 0,
        alignItems: 'flex-end',
        gap: '4px',
        paddingX: '16px',
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      {sections.map((section) => {
        const isFilters = section.body.kind === 'filters';

        return (
          <SidebarTab
            key={section.id}
            icon={section.header.icon ?? 'lucide:circle'}
            label={section.header.title}
            active={section.id === activeId}
            badge={isFilters ? chipCount : undefined}
            onClick={() => {
              onSelect(section.id);
            }}
          />
        );
      })}
    </Flex>
  );
};

/** The footer: the active variation label and, when present, the current year. */
const Footer = ({
  variationLabel,
  year,
  showYear,
}: {
  variationLabel?: string;
  year: number;
  showYear: boolean;
}) => {
  return (
    <Flex
      sx={{
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingX: '20px',
        paddingY: '12px',
        borderTop: `1px solid ${COLOR.border}`,
      }}
    >
      <Flex sx={{ alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: '6px',
            height: '6px',
            borderRadius: '9999px',
            backgroundColor: COLOR.primary,
          }}
        />
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '10px',
            color: COLOR.textFaint,
            maxWidth: '180px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {variationLabel}
        </Text>
      </Flex>

      {showYear ? (
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '10px',
            color: COLOR.textGhost,
          }}
        >
          {year}
        </Text>
      ) : null}
    </Flex>
  );
};

/** Resolves the currently-active variation from the shared selection. */
const useActiveVariation = (
  variationsBody?: GeovisWorkspaceSidebarVariationsBody
) => {
  const { selection } = useGeovisWorkspace();

  if (!variationsBody) {
    return undefined;
  }

  const selectedValue =
    selection[variationsBody.menuId] ?? variationsBody.defaultValue;

  return variationsBody.groups
    .flatMap((group) => {
      return group.variations;
    })
    .find((variation) => {
      return variation.value === selectedValue;
    });
};

/** The scrollable body: renders the active section's variations or filters. */
const TabContent = ({
  section,
  blocks,
  timeline,
  chips,
}: {
  section?: GeovisWorkspaceSidebarSection;
  blocks: GeovisWorkspaceSidebarFilterBlock[];
  timeline: ReturnType<typeof useTimeline>;
  chips: ReturnType<typeof useChipSelection>;
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {section?.body.kind === 'variations' ? (
        <VariationsTab body={section.body} />
      ) : section?.body.kind === 'filters' ? (
        <FiltersTab
          blocks={blocks}
          year={timeline.year}
          onYearChange={timeline.setYear}
          playing={timeline.playing}
          onTogglePlay={timeline.togglePlay}
          intervalSeconds={timeline.intervalSeconds}
          onIntervalChange={timeline.setIntervalSeconds}
          chipSelected={chips.selected}
          onChipToggle={chips.toggle}
          onChipClear={chips.clear}
        />
      ) : null}
    </Box>
  );
};

/**
 * The experimental preview left sidebar: a single ivory card with a header that
 * mirrors the active tab (its icon + title + a close button), an icon tab bar
 * (one tab per section), the active tab's body, and a footer showing the active
 * variation and year. The variations tab drives the shared selection; the
 * filter controls are visual-only, holding their state locally or lifted here
 * for the badge/footer.
 */
export const SidebarPreview = ({
  preview,
}: {
  preview: GeovisWorkspaceSidebarPreview;
}) => {
  const { setLeftSidebarOpen } = useGeovisWorkspace();

  const { sections } = preview;
  const { variationsBody, blocks, timeline, chips } = useSections(sections);

  const timelineState = useTimeline(timeline);
  const chipsState = useChipSelection(chips);
  const activeVariation = useActiveVariation(variationsBody);

  const [activeSectionId, setActiveSectionId] = React.useState<string>(() => {
    return sections[0]?.id ?? '';
  });

  const activeSection =
    sections.find((section) => {
      return section.id === activeSectionId;
    }) ?? sections[0];

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: ['100%', '308px'],
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        borderRadius: [0, '16px'],
        boxShadow: ['none', '0 8px 40px rgba(0,0,0,0.14)'],
      }}
    >
      <Header
        section={activeSection}
        onClose={(event) => {
          event.currentTarget.blur();
          setLeftSidebarOpen({ open: false });
        }}
      />

      <TabBar
        sections={sections}
        activeId={activeSection?.id}
        chipCount={chipsState.selected.length}
        onSelect={setActiveSectionId}
      />

      <TabContent
        section={activeSection}
        blocks={blocks}
        timeline={timelineState}
        chips={chipsState}
      />

      <Footer
        variationLabel={activeVariation?.label}
        year={timelineState.year}
        showYear={Boolean(timeline)}
      />
    </Flex>
  );
};
