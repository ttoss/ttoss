import type {
  GeovisWorkspaceSidebarChipsFilter,
  GeovisWorkspaceSidebarFilterBlock,
  GeovisWorkspaceSidebarSection,
  GeovisWorkspaceSidebarTimelineFilter,
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

const findBlocks = (
  sections: GeovisWorkspaceSidebarSection[]
): GeovisWorkspaceSidebarFilterBlock[] => {
  const body = sections.find((section) => {
    return section.body.kind === 'filters';
  })?.body;

  return body?.kind === 'filters' ? body.blocks : [];
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

/** Reads the sections into the typed pieces the layout needs. */
export const useSections = (sections: GeovisWorkspaceSidebarSection[]) => {
  const blocks = findBlocks(sections);

  return {
    variationsBody: findVariationsBody(sections),
    blocks,
    timeline: findTimeline(blocks),
    chips: findChips(blocks),
  };
};
