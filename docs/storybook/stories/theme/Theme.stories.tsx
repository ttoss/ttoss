import { Flex, Text } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import React from 'react';
import ReactJson from 'react-json-view';

import { action } from '@storybook/addon-actions';

import { BruttalTheme } from '@ttoss/theme';

export default {
  title: 'Theme/Theme',
} as Meta;

const Template: Story = (args) => {
  const [result, setResult] = React.useState<any>(BruttalTheme);

  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <Text sx={{ marginBottom: 3 }}>Update here the Dynamic theme</Text>

      <ReactJson
        src={result}
        onEdit={(e) => setResult(e.updated_src)}
        onAdd={(e) => action('adding key')(e)}
        onDelete={(e) => action('deleting key')(e)}
        enableClipboard
      />
    </Flex>
  );
};

export const DynamicTheme = Template.bind({});
