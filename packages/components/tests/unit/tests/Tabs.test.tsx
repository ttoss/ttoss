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
});

test('controlled Tabs: onSelect receives only tab indexes, not native select events from a panel input', async () => {
  const onSelect = jest.fn();

  const { getByRole, getByText } = render(
    <Tabs selectedIndex={0} onSelect={onSelect}>
      <Tabs.TabList>
        <Tabs.Tab>First</Tabs.Tab>
        <Tabs.Tab>Second</Tabs.Tab>
      </Tabs.TabList>
      <Tabs.TabPanel>
        <input aria-label="name" />
      </Tabs.TabPanel>
      <Tabs.TabPanel>Second content</Tabs.TabPanel>
    </Tabs>
  );

  await userEvent.type(getByRole('textbox', { name: 'name' }), 'abc');

  expect(onSelect).not.toHaveBeenCalled();

  await userEvent.click(getByText('Second'));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect.mock.calls[0][0]).toBe(1);
});
