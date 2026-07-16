import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Tab as RACTab,
  TabList as RACTabList,
  type TabListProps as RACTabListProps,
  TabPanel as RACTabPanel,
  type TabPanelProps as RACTabPanelProps,
  type TabProps as RACTabProps,
  Tabs as RACTabs,
  type TabsProps as RACTabsProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Navigation → CONTRACT.md §1 row: colors `navigation`, radii
// `control`, typography `label.md`, motion `feedback`.
//
// MAPPING NOTE (ROADMAP B2 "Taxonomy additions needed: none"): the RAC parts
// map onto existing structural roles without any new role —
//   Tabs → Navigation/root · TabList → Navigation/control · Tab → Navigation/item.
// `TabList` is the keyboard-navigable control strip through which the user
// switches view, so `control` fits. The active-tab underline is a decorative
// `data-part="indicator"` element (same pattern as Checkbox's indicator — a
// data-part without its own meta), so no `indicator` component is exported.
// A selected Tab reads the navigation `current` color (it sources the visible
// panel); hover/default flow through resolveInteractiveStyle.
//
// FRICTION LOG: the ROADMAP row listed the panel as "content", but Navigation
// has no `content` structural role — and semantically the panel is not
// navigation, it is the *content revealed by* navigation. So TabPanel is
// Entity = **Structure** (structure `content`, informational surface), which
// is both legal (ENTITY_STRUCTURE.Structure includes `content`) and the right
// meaning. No taxonomy change; the resolution was to pick the correct Entity,
// not to widen Navigation.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Tabs root (Navigation entity). */
export const tabsMeta = {
  displayName: 'Tabs',
  entity: 'Navigation',
  structure: 'root',
} as const satisfies ComponentMeta<'Navigation'>;

/** Formal semantic identity — TabList (Navigation entity, control strip). */
export const tabListMeta = {
  displayName: 'TabList',
  entity: 'Navigation',
  structure: 'control',
} as const satisfies ComponentMeta<'Navigation'>;

/** Formal semantic identity — Tab (Navigation entity, item). */
export const tabMeta = {
  displayName: 'Tab',
  entity: 'Navigation',
  structure: 'item',
} as const satisfies ComponentMeta<'Navigation'>;

/** Formal semantic identity — TabPanel (Structure entity, content surface). */
export const tabPanelMeta = {
  displayName: 'TabPanel',
  entity: 'Structure',
  structure: 'content',
} as const satisfies ComponentMeta<'Structure'>;

/** Props for the Tabs root. */
export type TabsProps = Omit<RACTabsProps, 'style'>;

/**
 * A tabbed navigation widget (Navigation entity). Compose with `TabList` +
 * `Tab` for the switcher and `TabPanel` for each view. React Aria manages
 * selection, arrow-key navigation, and panel association.
 *
 * @example
 * ```tsx
 * <Tabs>
 *   <TabList aria-label="Sections">
 *     <Tab id="a">Overview</Tab>
 *     <Tab id="b">Details</Tab>
 *   </TabList>
 *   <TabPanel id="a">Overview content</TabPanel>
 *   <TabPanel id="b">Details content</TabPanel>
 * </Tabs>
 * ```
 */
export const Tabs = ({ orientation = 'horizontal', ...props }: TabsProps) => {
  return (
    <RACTabs
      {...props}
      orientation={orientation}
      data-scope="tabs"
      data-part="root"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'row' : 'column',
          gap: vars.spacing.gap.stack.sm,
        } as React.CSSProperties
      }
    />
  );
};
Tabs.displayName = tabsMeta.displayName;

/** Props for the TabList control strip. */
export type TabListProps<T extends object = object> = Omit<
  RACTabListProps<T>,
  'style'
>;

/**
 * The strip of tabs. Renders the `tablist` and lays the `Tab`s out in a row
 * (or column when the parent `Tabs` is vertical).
 */
export const TabList = <T extends object = object>(props: TabListProps<T>) => {
  return (
    <RACTabList
      {...props}
      data-scope="tabs"
      data-part="control"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          gap: vars.spacing.gap.inline.sm,
          borderBlockEndWidth: vars.border.divider.width,
          borderBlockEndStyle: vars.border.divider.style,
          borderBlockEndColor:
            vars.colors.navigation.muted?.border?.default ?? 'transparent',
        } as React.CSSProperties
      }
    />
  );
};
TabList.displayName = tabListMeta.displayName;

/** Props for a single Tab. */
export type TabProps = Omit<RACTabProps, 'style'>;

/**
 * A single selectable tab. The selected tab reads the navigation `current`
 * color and shows an underline indicator; others use hover/default.
 */
export const Tab = (props: TabProps) => {
  const colors = vars.colors.navigation.primary;

  return (
    <RACTab
      {...props}
      data-scope="tabs"
      data-part="item"
      style={({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
      }) => {
        const selectedColor = colors?.text?.current ?? colors?.text?.default;
        return {
          boxSizing: 'border-box',
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          ...(vars.text.label.md as React.CSSProperties),
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'color',
          color: isSelected
            ? selectedColor
            : resolveInteractiveStyle(colors?.text, {
                isHovered,
                isPressed,
                isDisabled,
              }),
          outline: focusRingOutline(isFocusVisible),
        } as React.CSSProperties;
      }}
    >
      {({ isSelected }) => {
        return (
          <>
            {props.children as React.ReactNode}
            {/* Decorative active-tab underline. */}
            {isSelected && (
              <span
                data-scope="tabs"
                data-part="indicator"
                aria-hidden
                style={{
                  position: 'absolute',
                  insetInlineStart: 0,
                  insetInlineEnd: 0,
                  insetBlockEnd: 0,
                  borderBlockEndWidth: vars.border.outline.selected.width,
                  borderBlockEndStyle: vars.border.outline.control.style,
                  borderBlockEndColor:
                    vars.colors.navigation.primary?.border?.current ??
                    vars.colors.navigation.primary?.border?.default,
                }}
              />
            )}
          </>
        );
      }}
    </RACTab>
  );
};
Tab.displayName = tabMeta.displayName;

/** Props for a TabPanel. */
export type TabPanelProps = Omit<RACTabPanelProps, 'style'>;

/**
 * The content region for one tab. Associated with its `Tab` by matching `id`.
 */
export const TabPanel = (props: TabPanelProps) => {
  return (
    <RACTabPanel
      {...props}
      data-scope="tabs"
      data-part="content"
      style={({ isFocusVisible }) => {
        return {
          boxSizing: 'border-box',
          paddingBlock: vars.spacing.inset.surface.sm,
          ...(vars.text.body.md as React.CSSProperties),
          color: vars.colors.informational.primary?.text?.default,
          outline: focusRingOutline(isFocusVisible),
        } as React.CSSProperties;
      }}
    />
  );
};
TabPanel.displayName = tabPanelMeta.displayName;
