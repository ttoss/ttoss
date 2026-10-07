/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';
import type {
  TabListProps,
  TabPanelProps,
  TabProps,
  TabsProps,
} from 'react-tabs';
import { Tab, TabList, TabPanel, Tabs as ReactTabs } from 'react-tabs';

export type { TabListProps, TabPanelProps, TabProps, TabsProps };

// Props only react-tabs understands. They must not reach the outer `Box`: it
// renders a DOM element, where `onSelect` is the native `select` event, which
// React also delivers to ancestors when text selection changes in a
// descendant `<input>` — so a controlled `Tabs` received a `SyntheticEvent`
// instead of a tab index whenever the user typed inside a panel.
const REACT_TABS_ONLY_PROPS = new Set<string>([
  'defaultFocus',
  'defaultIndex',
  'direction',
  'disabledTabClassName',
  'disableUpDownKeys',
  'disableLeftRightKeys',
  'domRef',
  'environment',
  'focusTabOnClick',
  'forceRenderTabPanel',
  'onSelect',
  'selectedIndex',
  'selectedTabClassName',
  'selectedTabPanelClassName',
] satisfies (keyof TabsProps)[]);

export const Tabs = (props: BoxProps & TabsProps) => {
  const { sx: customSx, ...restProps } = props;

  const boxProps = Object.fromEntries(
    Object.entries(restProps).filter(([key]) => {
      return !REACT_TABS_ONLY_PROPS.has(key);
    })
  ) as BoxProps;

  return (
    <Box
      // eslint-disable-next-line complexity -- pre-existing optional theme-color lookups, unchanged by the prop split
      sx={({ colors }) => {
        const themeColors = colors as Record<string, any>;

        /**
         * https://github.com/reactjs/react-tabs/blob/main/style/react-tabs.css
         */
        return {
          /**
           * Tabs
           */
          '.react-tabs': {
            WebkitTapHighlightColor: 'transparent',
          },
          '.react-tabs__tab-list': {
            borderBottom: 'md',
            borderColor: themeColors?.input?.border?.muted?.default,
            paddingLeft: 0,
          },
          '.react-tabs__tab--selected': {
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: 'lg',
            borderColor: themeColors?.input?.border?.accent?.default,
          },
          '.react-tabs__tab': {
            color: themeColors?.input?.text?.secondary?.default,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2',
            padding: '3',
            cursor: 'pointer',
            position: 'relative',
            listStyle: 'none',
          },
          '.react-tabs__tab--disabled': {
            cursor: 'not-allowed',
            color: themeColors?.input?.text?.muted?.default,
          },
          '.react-tabs__tab:focus': {
            outline: 'none',
          },
          '.react-tabs__tab:focus:after': {
            position: 'absolute',
            height: 'min',
            left: '-2',
            right: '-2',
            bottom: '-3',
          },
          '.react-tabs__tab-panel': {
            display: 'none',
          },
          '.react-tabs__tab-panel--selected': {
            display: 'block',
          },
          ...customSx,
        };
      }}
      {...boxProps}
    >
      <ReactTabs {...restProps}>{props.children}</ReactTabs>
    </Box>
  );
};

Tabs.TabList = TabList;

/**
 * Tab default props
 * https://github.com/reactjs/react-tabs/blob/main/src/components/Tab.js
 */
Tabs.Tab = Tab;
Tabs.TabPanel = TabPanel;
