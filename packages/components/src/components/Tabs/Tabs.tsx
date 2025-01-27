/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconType } from '@ttoss/react-icons';
import { Box, BoxProps } from '@ttoss/ui';
import { Tab, TabList, TabPanel, Tabs as ReactTabs } from 'react-tabs';

export type TabsProps = {
  triggerList: {
    value: string;
    leftIcon?: IconType;
    name: string;
    disabled?: boolean;
  }[];
  triggerContentList: { value: string; content: React.ReactNode }[];
};

export const Tabs = (props: BoxProps & { children: React.ReactNode }) => {
  return (
    <Box
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
          },
          '.react-tabs__tab--selected': {
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: 'lg',
            borderColor: themeColors?.input?.border?.accent?.default,
          },
          '.react-tabs__tab': {
            color: themeColors?.input?.text?.secondary?.default,
            display: 'inline-block',
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
        };
      }}
      {...props}
    >
      <ReactTabs>{props.children}</ReactTabs>
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
