/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Meta, Story } from '@storybook/react';
import { SearchInput } from '@ttoss/components';
import { Text } from '@ttoss/ui';

export default {
  title: 'Components/SearchInput',
} as Meta;

const sleep = (timeout: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, timeout);
  });
};

const Template: Story = () => {
  const [debouncedValue, setDebouncedValue] = React.useState<any>('');

  const [loading, setLoading] = React.useState(false);

  const fakeFetchData = async () => {
    setLoading(true);
    await sleep(1000);
    setLoading(false);
  };

  return (
    <>
      <SearchInput
        defaultValue={debouncedValue}
        loading={loading}
        onChange={(value) => {
          setDebouncedValue(value);
          fakeFetchData();
        }}
      />

      <Text sx={{ marginTop: 'lg', fontSize: 'xl' }}>
        Debounced value: {debouncedValue}
      </Text>
    </>
  );
};

export const Example = Template.bind({});
