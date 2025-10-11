/* eslint-disable @typescript-eslint/no-explicit-any */
import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Search } from '@ttoss/components/Search';
import { Text } from '@ttoss/ui';
import * as React from 'react';

export default {
  title: 'Components/Search',
  component: Search,
  parameters: {
    docs: {
      description: {
        component:
          'Search input component with debouncing functionality to limit API calls. Includes loading state support.',
      },
    },
  },
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
Example.parameters = {
  docs: {
    description: {
      story:
        'Search component with debounced input and loading state. Try typing to see the debounce effect.',
    },
  },
};
