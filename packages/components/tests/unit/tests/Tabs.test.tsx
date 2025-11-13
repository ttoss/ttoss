import { Icon } from '@ttoss/react-icons';
import { render, userEvent } from '@ttoss/test-utils/react';
import { Flex } from '@ttoss/ui';

import { Tabs } from '../../../src/components/Tabs';

describe('Tabs Component', () => {
  test('renders Tabs with items', async () => {
    const args = {
      triggerList: [
        {
          value: 'members',
          name: 'Members',
          leftIcon: 'fluent:person-24-regular',
        },
        {
          value: 'campaigns',
          name: 'Campaigns',
          leftIcon: 'fluent:arrow-trending-lines-20-filled',
        },
        {
          value: 'dataloggers',
          name: 'Dataloggers',
          leftIcon: 'fluent:arrow-trending-lines-20-filled',
          disabled: true,
        },
      ],
      triggerContentList: [
        { value: 'members', content: <Flex>Members content</Flex> },
        { value: 'campaigns', content: <Flex>Campaigns content</Flex> },
        { value: 'dataloggers', content: <Flex>Dataloggers content</Flex> },
      ],
    };

    const { getByText, queryByText } = render(
      <Tabs>
        <Tabs.TabList>
          {args.triggerList.map((trigger) => {
            return (
              <Tabs.Tab key={trigger.value} disabled={trigger.disabled}>
                <Flex sx={{ gap: '2' }}>
                  {trigger.leftIcon && <Icon icon={trigger.leftIcon} />}
                  {trigger.name}
                </Flex>
              </Tabs.Tab>
            );
          })}
        </Tabs.TabList>
        {args.triggerContentList.map((content) => {
          return (
            <Tabs.TabPanel key={content.value}>{content.content}</Tabs.TabPanel>
          );
        })}
      </Tabs>
    );

    /**
     * Verify the default state (first tab selected)
     */
    expect(getByText('Members content')).toBeInTheDocument();
    expect(queryByText('Campaigns content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();

    /**
     * Click on the "Campaigns" tab
     */
    await userEvent.click(getByText('Campaigns'));
    expect(getByText('Campaigns content')).toBeInTheDocument();
    expect(queryByText('Members content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();

    /**
     * Click on the "Dataloggers" tab disabled
     */
    await userEvent.click(getByText('Dataloggers'));
    expect(getByText('Campaigns content')).toBeInTheDocument();
    expect(queryByText('Members content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();

    /**
     * Click back on the "Members" tab
     */
    await userEvent.click(getByText('Members'));
    expect(getByText('Members content')).toBeInTheDocument();
    expect(queryByText('Campaigns content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();
  });

  test('honors preserveLeftPadding prop (false) by removing left padding on TabList', () => {
    const { container } = render(
      <Tabs preserveLeftPadding={false}>
        <Tabs.TabList>
          <Tabs.Tab>One</Tabs.Tab>
          <Tabs.Tab>Two</Tabs.Tab>
        </Tabs.TabList>
        <Tabs.TabPanel>One content</Tabs.TabPanel>
        <Tabs.TabPanel>Two content</Tabs.TabPanel>
      </Tabs>
    );

    const tabList = container.querySelector(
      '.react-tabs__tab-list'
    ) as HTMLElement | null;
    expect(tabList).not.toBeNull();
    // Expect padding-left to be zero when preserveLeftPadding is false
    if (!tabList) throw new Error('Tab list element not found');
    expect(getComputedStyle(tabList).paddingLeft).toBe('0px');
  });
});
