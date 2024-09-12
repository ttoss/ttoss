/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Search } from '@ttoss/components/Search';
import { Text } from '@ttoss/ui';

export default {
  title: 'Components/Search',
} as Meta;

const sleep = (timeout: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, timeout);
  });
};

const Template: StoryFn = () => {
  const [debouncedValue, setDebouncedValue] = React.useState<any>('');

  const [loading, setLoading] = React.useState(false);

  const fakeFetchData = async () => {
    setLoading(true);
    await sleep(1000);
    setLoading(false);
  };

  return (
    <>
      <Search
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
