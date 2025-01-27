import { Icon } from '@ttoss/react-icons';
import { fireEvent, render } from '@ttoss/test-utils';
import { Flex } from '@ttoss/ui';

import { Tabs, TabsProps } from '../../../src/components/Tabs';

describe('Tabs Component', () => {
  test('renders a list with items', () => {
    const args: TabsProps = {
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
    fireEvent.click(getByText('Campaigns'));
    expect(getByText('Campaigns content')).toBeInTheDocument();
    expect(queryByText('Members content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();

    /**
     * Click on the "Dataloggers" tab disabled
     */
    fireEvent.click(getByText('Dataloggers'));
    expect(getByText('Campaigns content')).toBeInTheDocument();
    expect(queryByText('Members content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();

    /**
     * Click back on the "Members" tab
     */
    fireEvent.click(getByText('Members'));
    expect(getByText('Members content')).toBeInTheDocument();
    expect(queryByText('Campaigns content')).not.toBeInTheDocument();
    expect(queryByText('Dataloggers content')).not.toBeInTheDocument();
  });
});
