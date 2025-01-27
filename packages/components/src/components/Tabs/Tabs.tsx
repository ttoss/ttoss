/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon, IconType } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';
import * as React from 'react';
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

export const Tabs = ({
  props: { triggerList, triggerContentList },
}: {
  props: TabsProps;
}) => {
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
    >
      <ReactTabs>
        <TabList>
          {triggerList.map((trigger) => {
            return (
              <Tab key={trigger.value} disabled={trigger.disabled}>
                <Flex sx={{ gap: '2' }}>
                  {trigger.leftIcon && <Icon icon={trigger.leftIcon} />}
                  {trigger.name}
                </Flex>
              </Tab>
            );
          })}
        </TabList>
        {triggerContentList.map((content) => {
          return <TabPanel key={content.value}>{content.content}</TabPanel>;
        })}
      </ReactTabs>
    </Box>
  );
};
