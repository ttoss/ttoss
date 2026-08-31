import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarChipsFilter,
  GeovisWorkspaceSidebarFilterBlock,
  GeovisWorkspaceSidebarSection,
  GeovisWorkspaceSidebarTimelineFilter,
} from '../../context/GeovisWorkspaceContext';

/**
 * Every filter block in the sidebar, paired with the section holding it.
 * Flattened across sections because a config is free to split its filters over
 * several `filters` sections — the timeline in a tab of its own, say, beside a
 * tab holding the remaining controls.
 */
const findFilterBlocks = (
  sections: GeovisWorkspaceSidebarSection[]
): Array<{
  section: GeovisWorkspaceSidebarSection;
  block: GeovisWorkspaceSidebarFilterBlock;
}> => {
  return sections.flatMap((section) => {
    return section.body.kind === 'filters'
      ? section.body.blocks.map((block) => {
          return { section, block };
        })
      : [];
  });
};

/**
 * The sidebar's timeline and the section holding it. First one wins: the
 * timeline state is mounted once, above the two surfaces that drive it, so a
 * second timeline would run a second auto-advance timer against the same
 * selection.
 */
const findTimeline = (
  sections: GeovisWorkspaceSidebarSection[]
): {
  timeline?: GeovisWorkspaceSidebarTimelineFilter;
  timelineSection?: GeovisWorkspaceSidebarSection;
} => {
  for (const { section, block } of findFilterBlocks(sections)) {
    if (block.control.kind === 'timeline') {
      return { timeline: block.control, timelineSection: section };
    }
  }

  return {};
};

/**
 * The sidebar's chips filter and the section holding it. First one wins, for
 * the same reason as the timeline: one lifted selection, so one control.
 */
const findChips = (
  sections: GeovisWorkspaceSidebarSection[]
): {
  chips?: GeovisWorkspaceSidebarChipsFilter;
  chipsSection?: GeovisWorkspaceSidebarSection;
} => {
  for (const { section, block } of findFilterBlocks(sections)) {
    if (block.control.kind === 'chips') {
      return { chips: block.control, chipsSection: section };
    }
  }

  return {};
};

/**
 * Resolves a menu's effective value: the shared selection, falling back to the
 * `defaultValue` of the variations body that drives that menu.
 *
 * The fallback is what keeps a gate stable on first paint — a consumer that
 * does not seed through `getInitialSelection` would otherwise read `undefined`
 * and flash every gated section as disabled before the first pick.
 *
 * @param params.sections - The sidebar's sections.
 * @param params.selection - The shared selection.
 * @param params.menuId - Menu whose value to resolve.
 * @returns The selected value, the menu's default, or `undefined`.
 *
 * @example
 * resolveMenuValue({ sections, selection: {}, menuId: 'view' }); // 'points'
 */
export const resolveMenuValue = ({
  sections,
  selection,
  menuId,
}: {
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
  menuId: string;
}): string | undefined => {
  const selected = selection[menuId];

  if (selected !== undefined) {
    return selected;
  }

  for (const section of sections) {
    if (section.body.kind === 'variations' && section.body.menuId === menuId) {
      return section.body.defaultValue;
    }
  }

  return undefined;
};

/**
 * Whether a section is interactive: `true` unless its `enabledWhen` gate names
 * a menu whose current value is outside the gate's `values`.
 *
 * @param params.section - The section to test.
 * @param params.sections - Every section, used to resolve the gated menu's default.
 * @param params.selection - The shared selection.
 * @returns `true` when the section is enabled.
 *
 * @example
 * isSectionEnabled({ section, sections, selection: { view: 'points' } }); // true
 */
export const isSectionEnabled = ({
  section,
  sections,
  selection,
}: {
  section: GeovisWorkspaceSidebarSection;
  sections: GeovisWorkspaceSidebarSection[];
  selection: GeovisWorkspaceSelection;
}): boolean => {
  const gate = section.enabledWhen;

  if (!gate) {
    return true;
  }

  const value = resolveMenuValue({
    sections,
    selection,
    menuId: gate.menuId,
  });

  return value !== undefined && gate.values.includes(value);
};

/**
 * Reads the sections into the two lifted controls and the sections that own
 * them. A section's own blocks are read straight off its body where they are
 * rendered; what has to be resolved globally is the timeline and the chips,
 * whose state is lifted above the tab that holds them — and, with it, which
 * section that is: the timeline's gate decides whether playback runs, and the
 * chips' section is the tab that earns the count badge.
 *
 * @param sections - The sidebar's sections.
 * @returns The timeline and chips controls, each with its owning section;
 * every field is `undefined` when no `filters` section declares that control.
 *
 * @example
 * const { timeline, timelineSection } = useSections(sections);
 */
export const useSections = (sections: GeovisWorkspaceSidebarSection[]) => {
  const { timeline, timelineSection } = findTimeline(sections);
  const { chips, chipsSection } = findChips(sections);

  return { timeline, timelineSection, chips, chipsSection };
};
