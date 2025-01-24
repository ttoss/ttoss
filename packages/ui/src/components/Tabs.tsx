import { Icon, IconType } from '@ttoss/react-icons';
import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs as ReactTabs } from 'react-tabs';
import { Flex } from 'theme-ui';

export const Tabs = ({
  triggerList,
  triggerContentList,
}: {
  variant: 'outline' | 'line' | 'subtle' | 'enclosed' | 'plain' | undefined;
  triggerList: {
    value: string;
    leftIcon?: IconType;
    name: string;
    disabled?: boolean;
  }[];
  triggerContentList: { value: string; content: React.ReactNode }[];
}) => {
  return (
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
  );
};
