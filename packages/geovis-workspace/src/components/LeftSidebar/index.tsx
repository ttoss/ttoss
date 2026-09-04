import { useI18n } from '@ttoss/react-i18n';
import {
  Box,
  Flex,
  IconButton,
  Text,
  type ThemeUIStyleObject,
} from '@ttoss/ui';
import * as React from 'react';

import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarSection,
} from '../../context/GeovisWorkspaceContext';
import type { TimelineContextValue } from '../../context/TimelineContext';
import { useTimelineContext } from '../../context/TimelineContext';
import { useGeovisWorkspace } from '../../hooks/useGeovisWorkspace';
import { messages } from '../../messages';
import { FiltersTab } from './FiltersTab';
import { IconChip } from './IconChip';
import { SidebarTab } from './SidebarTab';
import { COLOR, FONT_HEAD } from './theme';
import { useChipSelection } from './useChipSelection';
import { isSectionEnabled, useSections } from './useSections';
import { VariationsTab } from './VariationsTab';

/**
 * The sidebar's close control. Shared by the header band and the tab row, which
 * take turns carrying it: whichever sits at the top of the card owns it.
 */
const CloseButton = ({
  onClose,
  sx,
}: {
  onClose: (event: React.MouseEvent<HTMLButtonElement>) => void;
  sx?: ThemeUIStyleObject;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
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
        ...sx,
      }}
    />
  );
};

/** The header band: the active section's icon chip, title, and close button. */
const Header = ({
  section,
  onClose,
}: {
  section?: GeovisWorkspaceSidebarSection;
  onClose: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
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
      {/*
        Both halves hang on the title: the chip is there to lead a name, so a
        section that declares none leaves the band empty rather than floating
        an icon on its own. The icon still identifies the section on its tab.
      */}
      <Flex sx={{ alignItems: 'center', gap: '10px' }}>
        {section?.header.title ? (
          <>
            {section.header.icon ? (
              <IconChip
                icon={section.header.icon}
                color={section.header.iconColor ?? COLOR.primary}
                background={section.header.iconBackground ?? COLOR.primaryTint}
                size={28}
                iconSize={14}
              />
            ) : null}

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
          </>
        ) : null}
      </Flex>

      <CloseButton onClose={onClose} />
    </Flex>
  );
};

/**
 * The icon tab bar: one tab per section, with the chip-count badge on the tab
 * that actually holds the chips — not on every `filters` tab, since a config
 * may split its filters across several of them.
 *
 * Takes the close button in with it (`onClose`) when no header band is drawn,
 * so the tabs sit at the top of the card instead of under an empty strip.
 */
const TabBar = ({
  sections,
  activeId,
  chipCount,
  chipsSectionId,
  disabledIds,
  onSelect,
  onClose,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  activeId?: string;
  chipCount: number;
  chipsSectionId?: string;
  disabledIds: Set<string>;
  onSelect: (id: string) => void;
  onClose?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  return (
    <Flex
      sx={{
        flexShrink: 0,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '8px',
        paddingX: '16px',
        borderBottom: `1px solid ${COLOR.border}`,
      }}
    >
      {/*
        The tabs are grouped rather than laid out directly, so the row's
        `space-between` pushes the close button to the far edge instead of
        spreading the tabs across the card.
      */}
      <Flex sx={{ alignItems: 'flex-end', gap: '4px' }}>
        {sections.map((section) => {
          const hasChips = section.id === chipsSectionId;
          const disabled = disabledIds.has(section.id);

          return (
            <SidebarTab
              key={section.id}
              icon={section.header.icon ?? 'lucide:circle'}
              // No title, no name for the tab but its id — see the note on
              // `GeovisWorkspaceSidebarHeader.title`.
              label={section.header.title ?? section.id}
              active={section.id === activeId}
              // A gated section's badge would advertise a count the user
              // cannot reach, so it goes away with the gate.
              badge={hasChips && !disabled ? chipCount : undefined}
              disabled={disabled}
              onClick={() => {
                onSelect(section.id);
              }}
            />
          );
        })}
      </Flex>

      {/* Centered against the 40px tabs rather than sitting on the rule. */}
      {onClose ? (
        <CloseButton onClose={onClose} sx={{ alignSelf: 'center' }} />
      ) : null}
    </Flex>
  );
};

/**
 * Ids of the sections whose `enabledWhen` gate is currently closed. Derived on
 * every render: the gate reads the same selection the variations tab writes, so
 * picking a variation opens or closes it in the same pass.
 */
const resolveDisabledIds = ({
  sections,
  selection,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
}): Set<string> => {
  const disabled = new Set<string>();

  for (const section of sections) {
    if (!isSectionEnabled({ section, sections, selection })) {
      disabled.add(section.id);
    }
  }

  return disabled;
};

/**
 * The section whose body the card shows: the selected one, unless its gate has
 * closed under the user — switching to a variation without a timeline while the
 * timeline tab was open would otherwise leave its body on screen, reachable and
 * interactive, with only its tab dimmed. With every gate closed there is
 * nothing to fall back to, so the selection stands.
 */
const resolveActiveSection = ({
  sections,
  activeSectionId,
  disabledIds,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  activeSectionId: string;
  disabledIds: Set<string>;
}): GeovisWorkspaceSidebarSection | undefined => {
  const selected =
    sections.find((section) => {
      return section.id === activeSectionId;
    }) ?? sections[0];

  if (!selected || !disabledIds.has(selected.id)) {
    return selected;
  }

  return (
    sections.find((section) => {
      return !disabledIds.has(section.id);
    }) ?? selected
  );
};

/**
 * The scrollable body: renders the active section's variations or filters.
 * Filter blocks come off the active section's own body, so each `filters` tab
 * shows the blocks it declares rather than a list resolved once for the sidebar.
 */
const TabContent = ({
  section,
  timeline,
  chips,
}: {
  section?: GeovisWorkspaceSidebarSection;
  timeline: TimelineContextValue;
  chips: ReturnType<typeof useChipSelection>;
}) => {
  const body = section?.body;

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {body?.kind === 'variations' ? (
        <VariationsTab body={body} />
      ) : body?.kind === 'filters' ? (
        <FiltersTab
          blocks={body.blocks}
          value={timeline.value}
          onValueChange={timeline.setValue}
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
 * The workspace's left sidebar: a single ivory card with a header that mirrors
 * the active tab (its icon + title + a close button), an icon tab bar (one tab
 * per section), and the active tab's body. The variations tab drives the shared
 * selection; the filter controls are visual-only, holding their state locally or
 * lifted here for the badge.
 *
 * Sections that declare no `header.title` at all drop the band and let the tab
 * bar head the card, close button included.
 *
 * Sections carrying filters may be several — the timeline in a tab of its own,
 * beside a tab holding the remaining controls. Each renders its own blocks; only
 * the timeline and the chips are resolved across the whole sidebar, because
 * their state is lifted out of the tab that shows them.
 *
 * Reads its sections from `config.leftSidebar.sections`. A `controls` slot
 * override (`config.slots.controls.component`) replaces this panel entirely.
 * Rendered only when `Layout` determines the `controls` slot has content.
 */
export const LeftSidebar = () => {
  const { config, selection, setLeftSidebarOpen } = useGeovisWorkspace();

  const sections = config.leftSidebar?.sections ?? [];
  const { chips, chipsSection } = useSections(sections);

  const disabledIds = resolveDisabledIds({ sections, selection });

  // Read, not owned: `Layout` holds it so the compact HUD can drive the same
  // playback while this card is closed (see TimelineContext).
  const timelineState = useTimelineContext();
  const chipsState = useChipSelection(chips);

  const [activeSectionId, setActiveSectionId] = React.useState<string>(() => {
    return sections[0]?.id ?? '';
  });

  const ControlsOverride = config.slots?.controls?.component;
  if (ControlsOverride) return <ControlsOverride />;

  const activeSection = resolveActiveSection({
    sections,
    activeSectionId,
    disabledIds,
  });

  /*
   * Decided across every section, not by the active one: a band that came and
   * went as the user switched tabs would shift the whole card up and down under
   * the pointer. So one titled section is enough to keep the band for all of
   * them — the untitled ones simply head it with nothing.
   */
  const hasHeaderBand = sections.some((section) => {
    return Boolean(section.header.title);
  });

  const closeSidebar = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    setLeftSidebarOpen({ open: false });
  };

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
      {hasHeaderBand ? (
        <Header section={activeSection} onClose={closeSidebar} />
      ) : null}

      <TabBar
        sections={sections}
        activeId={activeSection?.id}
        chipCount={chipsState.selected.length}
        chipsSectionId={chipsSection?.id}
        disabledIds={disabledIds}
        onSelect={setActiveSectionId}
        onClose={hasHeaderBand ? undefined : closeSidebar}
      />

      <TabContent
        section={activeSection}
        timeline={timelineState}
        chips={chipsState}
      />
    </Flex>
  );
};
