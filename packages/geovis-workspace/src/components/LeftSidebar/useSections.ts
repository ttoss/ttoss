import type {
  GeovisWorkspaceSelection,
  GeovisWorkspaceSidebarChipsFilter,
  GeovisWorkspaceSidebarFilterBlock,
  GeovisWorkspaceSidebarSection,
  GeovisWorkspaceSidebarTimelineFilter,
  GeovisWorkspaceSidebarVariation,
  GeovisWorkspaceSidebarVariationsBody,
} from '../../context/GeovisWorkspaceContext';

const findVariationsBody = (
  sections: GeovisWorkspaceSidebarSection[]
): GeovisWorkspaceSidebarVariationsBody | undefined => {
  const body = sections.find((section) => {
    return section.body.kind === 'variations';
  })?.body;

  return body?.kind === 'variations' ? body : undefined;
};

const findFiltersSection = (
  sections: GeovisWorkspaceSidebarSection[]
): GeovisWorkspaceSidebarSection | undefined => {
  return sections.find((section) => {
    return section.body.kind === 'filters';
  });
};

const findBlocks = (
  section?: GeovisWorkspaceSidebarSection
): GeovisWorkspaceSidebarFilterBlock[] => {
  return section?.body.kind === 'filters' ? section.body.blocks : [];
};

const findTimeline = (
  blocks: GeovisWorkspaceSidebarFilterBlock[]
): GeovisWorkspaceSidebarTimelineFilter | undefined => {
  const control = blocks.find((block) => {
    return block.control.kind === 'timeline';
  })?.control;

  return control?.kind === 'timeline' ? control : undefined;
};

const findChips = (
  blocks: GeovisWorkspaceSidebarFilterBlock[]
): GeovisWorkspaceSidebarChipsFilter | undefined => {
  const control = blocks.find((block) => {
    return block.control.kind === 'chips';
  })?.control;

  return control?.kind === 'chips' ? control : undefined;
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
 * The variation currently selected in the sidebar's variations body, or
 * `undefined` when there is no variations section or nothing matches.
 *
 * Shared because two surfaces name the active variation — the sidebar's own
 * footer and the map footer — and they must never disagree.
 *
 * @param params.variationsBody - The variations body, if the sidebar has one.
 * @param params.selection - The shared selection.
 * @returns The matching variation.
 *
 * @example
 * findActiveVariation({ variationsBody, selection: { view: 'points' } })?.label;
 */
export const findActiveVariation = ({
  variationsBody,
  selection,
}: {
  variationsBody?: GeovisWorkspaceSidebarVariationsBody;
  selection: GeovisWorkspaceSelection;
}): GeovisWorkspaceSidebarVariation | undefined => {
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

/** Reads the sections into the typed pieces the layout needs. */
export const useSections = (sections: GeovisWorkspaceSidebarSection[]) => {
  const filtersSection = findFiltersSection(sections);
  const blocks = findBlocks(filtersSection);

  return {
    variationsBody: findVariationsBody(sections),
    blocks,
    timeline: findTimeline(blocks),
    chips: findChips(blocks),
    /**
     * The section holding the filter blocks. Callers that gate timeline
     * behaviour need it: the gate lives on the section, not on the control.
     */
    filtersSection,
  };
};
